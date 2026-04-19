# Firestore Schema - CVSS & CVE Module

## Collection: `vulnerabilities`

Stores all vulnerability records created from bug submissions with CVSS scores, triage status, and CVE request tracking.

### Document: `vulnerabilities/{vulnId}`

Example ID: `BH-VULN-submission_abc123`

```typescript
{
  // Identifiers
  vulnId?: string;                    // Stored for convenience, usually matches doc ID
  submissionId: string;               // Reference to bug_submissions/{submissionId}
  huntId: string;                     // Reference to bug_hunts/{huntId}
  orgId: string;                      // Reference to orgs/{orgId}

  // Vulnerability Metadata
  title: string;                      // From submission
  description: string;                // Full description

  // CVSS Scoring
  cvss: {
    // Suggested (auto-generated)
    suggestedVector?: string;         // e.g., "CVSS:3.1/AV:N/AC:L/..."
    baseScoreSuggested?: number;      // 0.0 - 10.0
    severity?: string;                // CRITICAL|HIGH|MEDIUM|LOW|NONE
    suggestedBy?: string;             // "auto-bot" or triager uid
    suggestedAt?: timestamp;

    // Approved (triager finalized)
    vector?: string;                  // Final CVSS vector
    baseScore?: number;               // Final base score
    approvedBy?: string;              // Triager uid who approved
    approvedAt?: timestamp;
  };

  // BugHuntr Scoring
  bughuntrScore: {
    suggested?: number;               // Auto-computed score (0-10)
    approved?: number;                // Triager-approved score (0-10)
    components?: {
      exploitabilityModifier: number; // 1.0 - 1.2
      businessImpactMultiplier: number; // 0.5 - 2.0
      confidenceFactor: number;       // 0.7 - 1.0
    };
    version?: string;                 // "BH-v1.0"
  };

  // Status & Workflow
  status: string;                     // See Status Values below
  triage?: {
    suggestedBy?: string;             // Auto-bot uid
    reviewedBy?: string;              // Triager uid
    reviewedAt?: timestamp;
    triageNotes?: string;             // Why triager made adjustments
  };

  // Rejection Details (if rejected)
  rejectionReason?: string;           // "Score below threshold", etc.
  rejectedAt?: timestamp;
  rejectedBy?: string;                // Triager who rejected

  // Payout Integration
  payoutId?: string;                  // Reference to payouts/{payoutId}
  payoutStatus?: string;              // "pending", "manual_approval_pending"

  // CVE Request Integration
  cveRequestId?: string;              // Reference to cve_requests/{reqId}

  // Timestamps
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### Status Values

```
triage_pending              // Awaiting triager review
triage_pending_final_review // Triager saved draft, needs final review
triaged                     // CVSS approved and locked
rejected_low_severity       // Auto-rejected due to low BugHuntr score
eligible_for_payout         // Approved and reward tier determined
cve_requested               // CVE request initiated
disclosed                   // Publicly disclosed
fixed                       // Vendor has released fix
wont_fix                    // Vendor decided not to fix
archived                    // Closed/archived
```

## Subcollection: `vulnerabilities/{vulnId}/audit`

Append-only audit entries for all changes to CVSS, scores, status, and decisions.

### Document: `vulnerabilities/{vulnId}/audit/{auditId}`

```typescript
{
  timestamp: timestamp;
  actorUid: string;                   // User or "system:auto-*"
  action: string;                     // "suggestion_created"|"cvss_approved"|"vector_changed"|etc.

  // For CVSS changes
  oldVector?: string;
  newVector?: string;
  oldBaseScore?: number;
  newBaseScore?: number;
  oldBughuntrScore?: number;
  newBughuntrScore?: number;
  vectorDiff?: VectorDiff[];          // List of metric changes
  isSignificantChange?: boolean;      // Did high-impact metrics change?

  // For approvals
  triageNotes?: string;
  finalSignOff?: boolean;

  // For rejections/auto-decisions
  reason?: string;
  rewardTier?: string;
  rewardCents?: number;
  multiplier?: number;

  // For CVE requests
  cveRequestId?: string;
  disclosureType?: string;

  // Metadata
  ip?: string;                        // IP address for security audit
  userAgent?: string;                 // Browser/client info
}
```

### VectorDiff Interface

```typescript
interface VectorDiff {
  metric: string; // AV, AC, PR, UI, S, C, I, A
  oldValue: string; // Previous metric value
  newValue: string; // New metric value
  description: string; // Human-readable change
}
```

## Collection: `cve_requests`

Tracks CVE assignment requests and their status through the CNA workflow.

### Document: `cve_requests/{reqId}`

Example ID: `BH-CVE-submission_abc123-1702000000`

```typescript
{
  reqId: string;                      // Unique request ID
  vulnId: string;                     // Reference to vulnerabilities/{vulnId}

  // Requestor Info
  requestedBy: string;                // Triager uid
  requestorEmail: string;             // Triager email

  // Status Tracking
  status: string;                     // See CVE Status Values below
  statusHistory: [
    {
      status: string;
      timestamp: timestamp;
      changedBy: string;              // Who changed the status
      notes?: string;                 // Why the change
    }
  ];

  // Disclosure Packet
  disclosurePacket: {
    vulnId: string;
    title: string;
    description: string;              // Sanitized for public
    cvssVector: string;
    cvssBaseScore: number;
    bughuntrScore: number;

    timeline: {
      discoveredDate: timestamp;
      reportedDate: timestamp;
      patchedDate?: timestamp;        // When vendor released fix
      disclosureDate?: string;        // Proposed or actual disclosure date
    };

    pocPointer: string;               // Encrypted CID or storage location
    pocRedacted: string;              // Sanitized PoC for public CVE
    mitigation: string;               // Recommended mitigation steps
    references: string[];             // External references/links

    contactEmail: string;             // Org security contact
    orgConsent: boolean;              // Org approved coordination?
    disclosureType: string;           // "public" or "coordinated"
  };

  // CVE Assignment (filled by CNA)
  cveId?: string;                     // e.g., "CVE-2024-12345"
  cnaName?: string;                   // e.g., "MITRE"
  cnaContactEmail?: string;           // CNA contact (for reference)

  // Admin Notes & Metadata
  notes?: string;                     // Internal notes

  // Timestamps
  requestedAt: timestamp;
  updatedAt: timestamp;
}
```

### CVE Status Values

```
requested               // Initial request created, awaiting CNA acknowledgment
cna_acknowledged        // CNA received the request
cve_assigned            // CVE ID assigned
public                  // Publicly disclosed
rejected                // CNA or org rejected the request
withdrawn               // Request withdrawn by triager
on_hold                 // Temporarily on hold pending vendor response
```

## Collection: `orgs` (Schema Additions)

Add these fields to existing org documents for CVSS & CVE configuration.

### Fields to Add to `orgs/{orgId}`

```typescript
{
  // ... existing fields ...

  // Payout Policy
  payoutPolicy: {
    minScoreToPay: number;            // e.g., 4.0 (auto-reject below)
    rewardMultiplierTable: [
      {
        minScore: number;
        maxScore: number;
        multiplier: number;           // e.g., 2.0, 1.5, 1.0, 0.25
        tierName?: string;            // CRITICAL, HIGH, MEDIUM, LOW
        description?: string;
      }
    ];
    baseRewardPerSubmission?: number;  // Cents, e.g., 10000 = $100
  };

  // Asset Importance Mapping
  assetImportanceMap?: {
    [assetType: string]: number;
    // e.g.:
    // "payment_system": 2.0,
    // "authentication": 1.8,
    // "api_endpoint": 1.4,
    // "web_app": 1.2,
    // "internal_system": 1.0,
    // "staging": 0.5
  };

  // CVE Settings
  cveAutoRequestEnabled?: boolean;     // Auto-request CVE after triaging?
  cveCoordinationConsent?: boolean;    // Org allows coordinated disclosure?
  cnaContactEmail?: string;            // Default CNA email
  securityEmail?: string;              // Security team contact for packets

  // Payout Automation
  autoPayoutEnabled?: boolean;         // Create payout records automatically?
}
```

## Collection: `bug_submissions` (Schema Additions)

Add these fields to track CVSS/CVE status in submissions.

### Fields to Add to `bug_submissions/{submissionId}`

```typescript
{
  // ... existing fields ...

  // Vulnerability Triage Integration
  vulnerabilityId?: string;            // Reference to vulnerabilities/{vulnId}
  cvssStatus?: string;                 // "pending_suggestion", "pending_triager_review", "approved"

  // PoC Metadata (for scoring)
  pocType?: string;                    // "full_working_exploit", "partial_poc", "evidence_provided", "theoretical"
  hasPublicPoC?: boolean;              // Is PoC publicly available?
  pocStorageId?: string;               // Encrypted CID or storage location
  pocRedacted?: string;                // Public-safe version of PoC

  // Consent Tracking
  publicDisclosureConsent?: boolean;    // Reporter agrees to public disclosure?
  cveCoordinationConsent?: boolean;     // Reporter agrees to CVE coordination?

  // Timeline
  discoveredDate?: timestamp;
  reportedDate?: timestamp;

  // References
  mitigation?: string;
  references?: string[];
}
```

## Indexes Required

Create the following Firestore indexes for efficient queries:

### Vulnerabilities

```
Collection: vulnerabilities
Fields:
  - orgId (Ascending)
  - status (Ascending)
  - bughuntrScore.approved (Descending)
```

```
Collection: vulnerabilities
Fields:
  - status (Ascending)
  - createdAt (Descending)
```

```
Collection: vulnerabilities
Fields:
  - orgId (Ascending)
  - triage.reviewedAt (Descending)
```

### CVE Requests

```
Collection: cve_requests
Fields:
  - status (Ascending)
  - requestedAt (Descending)
```

```
Collection: cve_requests
Fields:
  - vulnId (Ascending)
  - requestedAt (Descending)
```

## Data Retention & Cleanup

- **Vulnerabilities**: Keep indefinitely for audit compliance
- **Audit Entries**: Keep indefinitely (immutable)
- **CVE Requests**: Keep indefinitely (may be referenced by external entities)
- **Old Status Records**: Archive after 2 years if status is "archived" or "wont_fix"

## Firestore Security Rules

See `docs/CVSS_AND_CVE_README.md` for detailed security rules configuration.
