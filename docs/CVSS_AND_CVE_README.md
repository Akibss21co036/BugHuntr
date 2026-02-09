# CVSS Scoring + CVE Request Workflow

## Overview

This module implements a production-ready CVSS v3.1 scoring system integrated with BugHuntr's vulnerability triage and reward decision pipeline. It provides:

1. **CVSS v3.1 Auto-Suggestion** — Heuristic-based vector suggestions based on submission metadata
2. **CVSS Base Score Calculation** — Standards-compliant CVSS v3.1 base score computation
3. **BugHuntr Internal Scoring** — Organization-specific severity scoring for reward tier determination
4. **Triager Approval Workflow** — Full audit trail for CVSS vector changes and approvals
5. **Reward Decision Automation** — Automatic payout eligibility and tier mapping
6. **CVE Request Workflow** — Coordinated/public disclosure request management and tracking

## Architecture

### Core Components

```
functions/src/
├── cvss/
│   ├── cvssEngine.ts          # CVSS v3.1 parser and base score calculator
│   └── bughuntrScoring.ts     # BugHuntr scoring formula and reward tiers
├── utils/
│   └── validateCvssVector.ts  # Vector validation and diff utilities
└── functions/
    ├── cvss/
    │   ├── createSuggestedCvss.ts        # Auto-suggest callable
    │   ├── approveCvss.ts                # Triager approval callable
    │   └── decideRewardAndPayoutDecision.ts  # Reward eligibility logic
    └── cve/
        ├── requestCve.ts                 # CVE request initiation
        └── checkCveAssignment.ts         # Status polling/reconciliation (TODO)
```

### Data Model

#### Vulnerabilities Collection

```firestore
vulnerabilities/{vulnId}
├── submissionId: string
├── huntId: string
├── orgId: string
├── title: string
├── description: string
├── cvss: {
│   suggestedVector: string        // e.g., "CVSS:3.1/AV:N/AC:L/..."
│   baseScore: number              // 0.0 - 10.0
│   severity: string               // CRITICAL|HIGH|MEDIUM|LOW|NONE
│   suggestedBy: string            // "auto-bot" or triager uid
│   suggestedAt: timestamp
│   vector: string                 // Final approved vector
│   approvedBy: string             // Triager uid
│   approvedAt: timestamp
│ }
├── bughuntrScore: {
│   suggested: number              // Initial auto-computed score
│   approved: number               // Final triager-approved score
│   components: {
│     exploitabilityModifier: number   // 1.0 default, 1.1-1.2 with PoC
│     businessImpactMultiplier: number // 0.5-2.0 based on asset importance
│     confidenceFactor: number         // 0.7-1.0 based on proof quality
│   }
│   version: string               // "BH-v1.0"
│ }
├── status: string                // triage_pending|triaged|rejected_low_severity|eligible_for_payout|disclosed|...
├── triage: {
│   suggestedBy: string
│   reviewedBy: string
│   reviewedAt: timestamp
│   triageNotes: string
│ }
├── rejectionReason: string       // If status = rejected_low_severity
├── payoutId: string              // Reference to payout record
├── cveRequestId: string          // Reference to CVE request
├── audit: subcollection          // Append-only audit entries
└── createdAt: timestamp
```

#### CVE Requests Collection

```firestore
cve_requests/{reqId}
├── vulnId: string
├── requestedBy: string
├── requestorEmail: string
├── status: string                // requested|cna_acknowledged|cve_assigned|public|rejected
├── disclosureType: string        // "public" or "coordinated"
├── disclosurePacket: {
│   description: string
│   cvssVector: string
│   bughuntrScore: number
│   timeline: { discoveredDate, reportedDate, disclosureDate }
│   pocPointer: string            // Encrypted CID (private)
│   pocRedacted: string           // Sanitized for public export
│   mitigation: string
│   references: []
│   orgConsent: boolean
│ }
├── cveId: string                 // Assigned by CNA (e.g., "CVE-2024-12345")
├── cnaContactEmail: string
├── notes: string
├── statusHistory: [
│   { status, timestamp, changedBy, notes }
│ ]
├── requestedAt: timestamp
├── updatedAt: timestamp
└── export.json: document         // CNA-friendly JSON export
```

#### Organization Config

Add to `orgs/{orgId}`:

```firestore
{
  payoutPolicy: {
    minScoreToPay: number        // e.g., 4.0 (auto-reject below this)
    rewardMultiplierTable: [
      {
        minScore: number,
        maxScore: number,
        multiplier: number      // 0.25, 1.0, 1.5, 2.0, etc.
      }
    ]
    baseRewardPerSubmission: number  // Cents, e.g., 10000 = $100
  }
  assetImportanceMap: {
    "payment_system": 2.0,          // Critical
    "authentication": 1.8,
    "api_endpoint": 1.4,
    "web_app": 1.2,
    "internal_system": 1.0,
    "staging": 0.5
  }
  cveAutoRequestEnabled: boolean      // Auto-request CVE after triaging?
  cveCoordinationConsent: boolean      // Org allows coordinated disclosure?
  cnaContactEmail: string             // Default CNA contact
  securityEmail: string               // Org security contact for CVE packet
  autoPayoutEnabled: boolean          // Auto-create payout records?
}
```

## CVSS v3.1 Implementation

### Base Score Calculation

BugHuntr implements the official CVSS v3.1 base score formula per [NIST SP 800-113](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-113.pdf).

**Metrics:**

| Metric | Values     | Description                                  |
| ------ | ---------- | -------------------------------------------- |
| **AV** | N, A, L, P | Network (remote), Adjacent, Local, Physical  |
| **AC** | L, H       | Attack Complexity: Low (easy) or High (hard) |
| **PR** | N, L, H    | Privileges Required: None, Low, or High      |
| **UI** | N, R       | User Interaction: None or Required           |
| **S**  | U, C       | Scope: Unchanged or Changed                  |
| **C**  | N, L, H    | Confidentiality: None, Low, or High          |
| **I**  | N, L, H    | Integrity: None, Low, or High                |
| **A**  | N, L, H    | Availability: None, Low, or High             |

**Example Vector:**

```
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H
```

This is a network-accessible, low-complexity, unauthenticated RCE with full impact = **10.0 (CRITICAL)**

## BugHuntr Scoring Formula

BugHuntr uses an internal severity score that adjusts CVSS for organizational context:

```
BugHuntrScore = clamp(CVSS_base × EM × BIM × CF, 0, 10)
```

Where:

- **CVSS_base** (0–10): Official CVSS v3.1 base score
- **EM** (Exploitability Modifier, 1.0–1.2):
  - 1.0 = No public PoC
  - 1.1 = Public PoC or known exploit exists
  - 1.2 = Widely exploited in the wild
- **BIM** (Business Impact Multiplier, 0.5–2.0):
  - Per-asset importance (org-configurable)
  - Payment system: 2.0 (critical)
  - Web app: 1.2 (medium)
  - Staging: 0.5 (low)
- **CF** (Confidence Factor, 0.7–1.0):
  - 0.7 = Theoretical/no PoC
  - 0.85 = Evidence provided (default)
  - 0.9 = Partial working PoC
  - 1.0 = Full, reproducible exploit

### Example Calculation

```
Vulnerability: SQL Injection in payment API

CVSS Calculation:
  Vector: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N
  Base Score: 8.6

BugHuntr Adjustment:
  EM = 1.1 (reporter included PoC)
  BIM = 2.0 (payment system = critical)
  CF = 0.9 (partial working PoC)

  BugHuntr Score = 8.6 × 1.1 × 2.0 × 0.9 = 17.028 → clamped to 10.0

Reward Decision:
  Score 10.0 → CRITICAL tier (2.0x multiplier)
  Base Reward: $100
  Final Reward: $200
```

## Workflow: Auto-Suggestion → Approval → Reward Decision

### 1. Create Suggested CVSS

**Trigger:** Manual or automatic after bug submission  
**Function:** `createSuggestedCvss`

**Flow:**

```
[Submit Bug]
    ↓
[Extract Metadata: vuln type, auth required, PoC type, asset]
    ↓
[Call suggestVectorFromSubmission() heuristic]
    ↓
[Compute CVSS base score]
    ↓
[Apply org-specific factors for BugHuntr score]
    ↓
[Store as vulnerabilities/{vulnId} with status: triage_pending]
    ↓
[Notify triager in dashboard]
```

**Input:**

```typescript
{
  submissionId: "submission_abc123"
  override?: { vector?: "CVSS:3.1/..." }
}
```

**Output:**

```typescript
{
  success: true,
  vulnId: "BH-VULN-submission_abc123",
  suggestedVector: "CVSS:3.1/AV:N/AC:L/...",
  baseScore: 7.5,
  severity: "HIGH",
  bughuntrScore: 8.2,
  factors: {
    exploitabilityModifier: 1.1,
    businessImpactMultiplier: 1.2,
    confidenceFactor: 0.9
  }
}
```

### 2. Triager Reviews & Approves

**Function:** `approveCvss`

**UI:** Triage editor component shows:

- Suggested vector (editable metric dropdowns)
- Live CVSS base score calculation
- BugHuntr score breakdown with audit trail
- Vector change diff (highlight significant changes)
- "Approve & Sign-off" button (triggers reward decision)

**Flow:**

```
[Triager edits vector if needed]
    ↓
[Validate vector format]
    ↓
[Compute new CVSS and BugHuntr scores]
    ↓
[Calculate diff vs. suggestion]
    ↓
[Transaction: update vuln, append audit, potentially trigger reward]
    ↓
[Status: triaged (if final sign-off)]
    ↓
[Notify: reporter, admins]
```

**Input:**

```typescript
{
  vulnId: "BH-VULN-abc123",
  cvssVector: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:N",
  triageNotes: "Adjusted PR to Low (requires auth). Vector is accurate.",
  finalSignOff: true
}
```

**Output:**

```typescript
{
  success: true,
  vulnId: "BH-VULN-abc123",
  auditId: "audit_xyz",
  cvss: { vector, baseScore, approvedBy, approvedAt },
  bughuntrScore: 7.8,
  status: "triaged"
}
```

### 3. Reward Decision

**Trigger:** Automatic after `approveCvss(finalSignOff=true)`  
**Function:** `decideRewardAndPayoutDecision`

**Logic:**

```
if (bughuntrScore < org.payoutPolicy.minScoreToPay) {
  status = "rejected_low_severity"
  notify hunter: "Your submission does not qualify for a reward under our policy."
} else {
  find reward tier for bughuntrScore
  compute reward = baseReward × tierMultiplier
  create payouts/{payoutId} record
  status = "eligible_for_payout"
  notify hunter: "Your submission qualifies for a ${reward} reward."
  if org.autoPayoutEnabled: initiate payout via existing payout system
}
```

**Audit Entry:**

```typescript
{
  timestamp: now,
  actorUid: "system:reward-decision",
  action: "reward_decided",
  bughuntrScore: 7.8,
  rewardTier: "HIGH",
  rewardCents: 15000,
  multiplier: 1.5,
  autoPayoutEnabled: true
}
```

## CVE Request Workflow

### 1. Request CVE

**Function:** `requestCve`  
**Trigger:** Triager initiates CVE request from triage UI

**Inputs:**

```typescript
{
  vulnId: "BH-VULN-abc",
  requestorUid: "triager_uid",
  disclosureType: "coordinated" | "public",
  notes?: "Additional context for CNA",
  cnaContactEmail?: "cna@mitre.org"
}
```

**Validations:**

- Vulnerability must be `status: triaged` (CVSS approved)
- For coordinated disclosure: org must consent OR triager override with justification
- For public disclosure: reporter must consent

**Output:**

```typescript
{
  success: true,
  reqId: "BH-CVE-abc123-1702000000",
  status: "requested",
  vulnId: "BH-VULN-abc",
  disclosureType: "coordinated",
  nextStep: "Awaiting CNA acknowledgment. Check status at /admin/cve-requests"
}
```

**Creates:**

- `cve_requests/{reqId}` with disclosure packet
- Audit entry in `vulnerabilities/{vulnId}/audit`
- Sets `vulnerabilities/{vulnId}.status = "cve_requested"`

### 2. Track CVE Assignment

**Function:** `checkCveAssignment` (scheduled, runs hourly)  
**TODO:** Integrate with real CNA APIs (MITRE, NVD, etc.)

**Current Status Workflow:**

```
requested → cna_acknowledged → cve_assigned → public → (end)
                                    ↓
                                 rejected
```

**Admin UI Capabilities:**

- View pending CVE requests
- Send request to CNA (with contact email)
- Receive CVE ID update (manual form or API integration)
- Mark as public / rejected with notes
- Generate CNA-friendly export

### 3. CVE Export

**Endpoint:** GET `/admin/cve-requests/{reqId}/export`  
**Format:** JSON (CNA-friendly)

**Contents:**

```json
{
  "cvss": {
    "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    "baseScore": 10.0
  },
  "bughuntrScore": 9.5,
  "description": "Unauthenticated remote code execution in ...",
  "timeline": {
    "discovered": "2024-01-15",
    "reported": "2024-01-20",
    "patched": "2024-02-10",
    "disclosed": "2024-03-01"
  },
  "mitigation": "Update to version X or apply patch Y",
  "references": ["https://..."],
  "pocRedacted": "The vulnerability can be exploited by ...",
  "contactEmail": "security@company.com"
}
```

**Security:**

- Full PoC is NOT exported (stored separately, encrypted)
- Export marked "For CNA Use Only"
- Requires admin authentication

## Security & Privacy

### PoC Storage

- Full PoC files stored in `pro-assets/` with NDA token access control
- `pocPointer` in disclosure packet is encrypted CID
- `pocRedacted` in CVE export is sanitized, safe for publication

### Secrets Management

- CNA contact tokens: stored in Firebase Functions config or Google Secret Manager
- Email hooks for notifications: read from config
- **Never hardcode secrets**

### Firestore Security Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Vulnerabilities collection
    match /vulnerabilities/{vulnId} {
      // Triagers can write cvss and triage fields
      allow write: if request.auth.token.role in ['admin', 'triager'];
      // Submitter can read own vulnerability
      allow read: if request.auth.uid == resource.data.submitterUid
                  || request.auth.token.role in ['admin', 'triager'];
    }

    // CVE Requests
    match /cve_requests/{reqId} {
      // Only triagers and admins can create
      allow create: if request.auth.token.role in ['admin', 'triager'];
      // Only requestor and admins can update status
      allow update: if request.auth.uid == resource.data.requestedBy
                    || request.auth.token.role == 'admin';
      // Auditable read access
      allow read: if request.auth.token.role in ['admin', 'triager']
                  || request.auth.uid == resource.data.requestedBy;
    }
  }
}
```

## Configuration

### Setting Up Org Policy

```javascript
// Firestore console
db.collection("orgs")
  .doc("my-org")
  .set(
    {
      payoutPolicy: {
        minScoreToPay: 4.0,
        rewardMultiplierTable: [
          {
            minScore: 9.0,
            maxScore: 10.0,
            multiplier: 2.0,
            tierName: "CRITICAL",
          },
          { minScore: 7.0, maxScore: 8.99, multiplier: 1.5, tierName: "HIGH" },
          {
            minScore: 4.0,
            maxScore: 6.99,
            multiplier: 1.0,
            tierName: "MEDIUM",
          },
          { minScore: 0.1, maxScore: 3.99, multiplier: 0.25, tierName: "LOW" },
        ],
        baseRewardPerSubmission: 10000, // $100 base
      },
      assetImportanceMap: {
        payment_system: 2.0,
        authentication: 1.8,
        api_endpoint: 1.4,
        web_app: 1.2,
        internal_system: 1.0,
        staging: 0.5,
      },
      cveAutoRequestEnabled: false,
      cveCoordinationConsent: true,
      autoPayoutEnabled: false, // Require manual approval
    },
    { merge: true }
  );
```

### Environment Setup

```bash
# No additional secrets for MVP
# Future: Add CNA contact tokens
firebase functions:config:set cve.cna_api_key="xxx"
```

## Testing

### Unit Tests

```bash
npm test -- cvss/cvssEngine.test.ts
npm test -- cvss/bughuntrScoring.test.ts
```

Test Coverage:

- CVSS vector parsing and validation
- Base score calculation (critical, high, medium, low, none)
- Heuristic suggestions for 8+ vulnerability types
- BugHuntr score multipliers
- Reward tier mapping
- Payout eligibility logic

### Integration Tests

```bash
npm test -- integration/cvss-workflow.test.ts
```

Scenarios:

1. Auto-suggest → Approve → Reward Decision (happy path)
2. Triager overrides suggestion (vector change audit)
3. Auto-rejection (low severity)
4. CVE request creation and status tracking
5. Concurrent edits (transaction safety)

### Manual Testing

**Firebase Emulator:**

```bash
firebase emulators:start
```

**Sample Payloads:**

```javascript
// 1. Create suggested CVSS
firebase
  .functions()
  .httpsCallable("createSuggestedCvss")({
    submissionId: "test_submission_001",
  })
  .then((result) => console.log(result.data));

// 2. Approve CVSS
firebase
  .functions()
  .httpsCallable("approveCvss")({
    vulnId: "BH-VULN-test_submission_001",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    triageNotes: "Confirmed as RCE. Full impact.",
    finalSignOff: true,
  })
  .then((result) => console.log(result.data));

// 3. Request CVE
firebase
  .functions()
  .httpsCallable("requestCve")({
    vulnId: "BH-VULN-test_submission_001",
    requestorUid: "triager_uid",
    disclosureType: "coordinated",
    notes: "Ready for CNA coordination",
    cnaContactEmail: "cve@mitre.org",
  })
  .then((result) => console.log(result.data));
```

## Postman Collection

See `postman/CVSS-Workflow.postman_collection.json` for API examples.

## TODOs & Future Work

- [ ] **CNA Integration**: Call MITRE/NVD APIs for CVE assignment
- [ ] **Temporal Metrics**: Support CVSS v3.1 temporal and environmental scores
- [ ] **Known Exploit DB**: Auto-detect public exploits in PoC or references
- [ ] **Machine Learning**: Train heuristic suggestions on historical data
- [ ] **Email Notifications**: Alert reporters, admins, CNA contacts
- [ ] **Webhook Handlers**: Inbound CNA updates (CVE assigned, etc.)
- [ ] **Graphical Vector Editor**: Drag-drop metric selection UI
- [ ] **Bulk Triage**: Admin mass-approval with policy overrides

## References

- **CVSS v3.1 Spec**: https://www.first.org/cvss/v3.1/specification-document
- **NIST SP 800-113**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-113.pdf
- **MITRE CVE Program**: https://www.cve.org/
- **CNA Onboarding**: https://www.cve.org/CNA/Procedures

## Support

For issues or questions:

1. Check the troubleshooting section in this README
2. Review audit logs in Firestore: `vulnerabilities/{vulnId}/audit`
3. Enable Cloud Functions debug logging: `firebase functions:log`
4. Contact security team: `security@bughuntr.io`
