# CVSS Quick Reference Card

## 🎯 Quick Start

```bash
# View demo
http://localhost:3000/cvss-demo

# Admin dashboards
http://localhost:3000/admin/cve-requests
http://localhost:3000/admin/vulnerability/[vulnId]
```

## 📊 CVSS v3.1 Metrics

### Exploitability

| Metric | Values     | Description                        |
| ------ | ---------- | ---------------------------------- |
| **AV** | N, A, L, P | Network, Adjacent, Local, Physical |
| **AC** | L, H       | Low, High complexity               |
| **PR** | N, L, H    | None, Low, High privileges         |
| **UI** | N, R       | None, Required interaction         |

### Impact

| Metric | Values  | Description                      |
| ------ | ------- | -------------------------------- |
| **S**  | U, C    | Unchanged, Changed scope         |
| **C**  | H, L, N | Confidentiality: High, Low, None |
| **I**  | H, L, N | Integrity: High, Low, None       |
| **A**  | H, L, N | Availability: High, Low, None    |

## 🔢 Score Ranges

```
0.0       = None
0.1-3.9   = Low
4.0-6.9   = Medium
7.0-8.9   = High
9.0-10.0  = Critical
```

## 💰 Reward Tiers

| Tier     | Score Range | Base Reward |
| -------- | ----------- | ----------- |
| CRITICAL | 9.0-10.0    | $5,000+     |
| HIGH     | 7.0-8.9     | $2,500+     |
| MEDIUM   | 4.0-6.9     | $1,000+     |
| LOW      | 1.0-3.9     | $500+       |
| INFO     | 0.1-0.9     | $100+       |

## 🏗️ Asset Multipliers

```typescript
payment_system:   2.0x
authentication:   1.8x
api:              1.2x
web_app:          1.0x
documentation:    0.5x
```

## 📐 Formulas

### CVSS Base Score

```javascript
impact =
  scope === "C"
    ? 7.52 * (isc - 0.029) - 3.25 * Math.pow(isc - 0.02, 15)
    : 6.42 * isc;

exploitability = 8.22 * AV * AC * PR * UI;

baseScore =
  scope === "C"
    ? Math.min(1.08 * (impact + exploitability), 10)
    : Math.min(impact + exploitability, 10);
```

### BugHuntr Score

```javascript
bugHuntrScore = cvssBase
  × assetMultiplier
  × exploitabilityFactor
  × (hasPoC ? 1.1 : 1.0);
```

## 🎨 Vector Examples

### Critical Vulnerabilities

**SQL Injection (10.0)**

```
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H
```

**RCE - Unauthenticated (9.8)**

```
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
```

**Auth Bypass (9.1)**

```
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N
```

### High Vulnerabilities

**Authenticated RCE (8.8)**

```
CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H
```

**Privilege Escalation (8.8)**

```
CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H
```

### Medium Vulnerabilities

**CSRF (6.5)**

```
CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N
```

**Stored XSS (5.4)**

```
CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N
```

**Information Disclosure (5.3)**

```
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N
```

### Low Vulnerabilities

**Reflected XSS (6.1)**

```
CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N
```

**Path Traversal (6.5)**

```
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N
```

## 🔧 Code Snippets

### Parse Vector

```typescript
import { parseVectorString } from "@/functions/src/cvss/cvssEngine";

const vector = parseVectorString(
  "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
);
// Returns: { AV: 'N', AC: 'L', PR: 'N', ... }
```

### Calculate Score

```typescript
import { computeBaseScore } from "@/functions/src/cvss/cvssEngine";

const score = computeBaseScore(vector);
// Returns: 9.8
```

### Get BugHuntr Score

```typescript
import { computeBugHuntrScore } from "@/functions/src/cvss/bughuntrScoring";

const result = computeBugHuntrScore(9.8, {
  businessImpactMultiplier: 2.0, // payment system
  exploitabilityModifier: 1.0,
  pocBonus: 1.1, // has PoC
});
// result.score: 21.56
```

### Map to Reward Tier

```typescript
import { mapScoreToRewardTier } from "@/functions/src/cvss/bughuntrScoring";

const tier = mapScoreToRewardTier(21.56, DEFAULT_REWARD_TIER_TABLE);
// Returns: 'CRITICAL'
```

## 🎯 CVE Eligibility

A vulnerability is CVE-eligible if:

- ✅ CVSS Base Score ≥ 7.0
- ✅ Affects publicly available software
- ✅ Vendor acknowledges the issue
- ✅ Patch available or in development
- ✅ Meets CVE Program scope

## 🔐 Firestore Schema

### Vulnerabilities Collection

```typescript
{
  id: string;
  submissionId: string;
  orgId: string;

  // CVSS Data
  suggestedVector: string;
  suggestedBaseScore: number;
  currentVector?: string;
  currentBaseScore?: number;

  // BugHuntr Scoring
  suggestedBughuntrScore: number;
  currentBughuntrScore?: number;
  assetType: string;
  businessImpactMultiplier: number;

  // Status
  status: 'triage_pending' | 'cvss_approved' | 'reward_decided';

  // CVE
  cveRequested?: boolean;
  cveId?: string;
}
```

### CVE Requests Collection

```typescript
{
  id: string;
  vulnId: string;
  requestedBy: string;
  requestedAt: Timestamp;
  status: 'pending' | 'submitted' | 'assigned' | 'rejected';
  cveId?: string;
  assignedAt?: Timestamp;
}
```

## 🚦 Status Flow

```
Bug Submitted
    ↓
triage_pending (suggested vector auto-generated)
    ↓
Triager reviews/edits vector
    ↓
cvss_approved (triager approves)
    ↓
Admin reviews for CVE eligibility
    ↓
reward_decided (final tier assigned)
    ↓
CVE request submitted (if eligible)
    ↓
CVE-ID assigned (from CVE Program)
```

## 📞 API Functions

### Cloud Functions

```typescript
// Generate suggested CVSS vector
createSuggestedCvss(submissionId: string): Promise<string>;

// Approve CVSS vector
approveCvssVector(
  vulnId: string,
  vector: string,
  notes: string,
  finalSignOff: boolean
): Promise<void>;

// Request CVE assignment
requestCveAssignment(vulnId: string): Promise<string>;

// Compute BugHuntr score
computeBugHuntrScore(
  cvssBase: number,
  factors: BugHuntrScoringFactors
): BugHuntrScoringResult;
```

## 🎨 UI Components

### Use CVSS Editor

```tsx
import { TriageCvssEditor } from "@/components/triage/TriageCvssEditor";

<TriageCvssEditor
  vulnId={vulnId}
  suggestedVector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
  suggestedScore={9.8}
  status="triage_pending"
  onApprove={handleApprove}
/>;
```

### Use Auth Hook

```tsx
import { useAuth } from "@/hooks/use-auth";

const { user, loading } = useAuth();

if (user?.role === "admin") {
  // Show admin features
}
```

## 📝 Testing

### Run Demo

```bash
npm run dev
# Visit http://localhost:3000/cvss-demo
```

### Run Tests

```bash
cd functions
npm test

# Specific test suites
npm test -- cvssEngine.test.ts
npm test -- bughuntrScoring.test.ts
npm test -- cvss-workflow.test.ts
```

## 🔗 Quick Links

- Demo: `/cvss-demo`
- CVE Requests: `/admin/cve-requests`
- Vulnerability Detail: `/admin/vulnerability/[vulnId]`
- Docs: `/docs/CVSS_DEMO_GUIDE.md`
- API Docs: `/docs/CVSS_AND_CVE_README.md`

---

**Print this card for quick reference while developing!**
