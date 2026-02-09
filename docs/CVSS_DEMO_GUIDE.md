# CVSS Implementation Demo Guide

## Overview

This guide provides a complete walkthrough of BugHuntr's CVSS v3.1 + CVE workflow implementation, including interactive demonstrations and usage examples.

## Quick Access

- **Demo URL**: `/cvss-demo`
- **Admin Dashboard**: `/admin/cve-requests`
- **Vulnerability Triage**: `/admin/vulnerability/[vulnId]`

---

## 🎯 What's Included

### 1. CVSS Vector Calculator

- **Interactive Builder**: Configure all 8 CVSS v3.1 base metrics
- **Real-time Scoring**: Instant base score calculation (0.0 - 10.0)
- **Severity Rating**: Automatic classification (NONE/LOW/MEDIUM/HIGH/CRITICAL)
- **Vector Generation**: Auto-generated CVSS vector strings

### 2. BugHuntr Scoring System

- **Business Multipliers**: Asset-type based score adjustments
  - Payment System: 2.0x
  - Authentication: 1.8x
  - API: 1.2x
  - Web App: 1.0x
  - Documentation: 0.5x
- **PoC Bonus**: +10% for verified proof of concept
- **Exploitability Factor**: Variable 0.8x - 1.2x adjustment

### 3. Reward Tier Mapping

- **Automated Tiers**: Score-based tier assignment
  - CRITICAL (9.0-10.0): $5,000+
  - HIGH (7.0-8.9): $2,500+
  - MEDIUM (4.0-6.9): $1,000+
  - LOW (1.0-3.9): $500+
  - INFO (0.1-0.9): $100+
- **Estimation**: Real-time reward estimates

### 4. CVE Request Workflow

- **Eligibility Check**: Automatic CVE qualification
- **Request Tracking**: Complete audit trail
- **Status Management**: Multi-stage approval process

---

## 📋 Demo Scenarios

### Scenario 1: Critical SQL Injection

**Vulnerability**: SQL Injection in Login Form

**CVSS Vector**: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H`

**Metrics Breakdown**:

- Attack Vector: Network (remotely exploitable)
- Attack Complexity: Low (no special conditions)
- Privileges Required: None (unauthenticated)
- User Interaction: None (fully automated)
- Scope: Changed (breaks authorization boundary)
- Confidentiality: High (full database access)
- Integrity: High (can modify all data)
- Availability: High (can delete database)

**Results**:

- CVSS Base Score: **10.0**
- Severity: **CRITICAL**
- BugHuntr Score: **11.0** (with 1.1x PoC bonus)
- Reward Tier: **CRITICAL**
- Estimated Payout: **$5,000+**
- CVE Eligible: ✅ Yes

---

### Scenario 2: Stored XSS

**Vulnerability**: Stored XSS in User Profile

**CVSS Vector**: `CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N`

**Metrics Breakdown**:

- Attack Vector: Network
- Attack Complexity: Low
- Privileges Required: Low (authenticated user)
- User Interaction: Required (victim must view profile)
- Scope: Changed (executes in another user's context)
- Confidentiality: Low (can steal session tokens)
- Integrity: Low (can modify DOM)
- Availability: None

**Results**:

- CVSS Base Score: **5.4**
- Severity: **MEDIUM**
- BugHuntr Score: **5.9** (with PoC bonus)
- Reward Tier: **MEDIUM**
- Estimated Payout: **$1,000+**
- CVE Eligible: ❌ No (score < 7.0)

---

### Scenario 3: Payment System RCE

**Vulnerability**: RCE in Payment Processing API

**CVSS Vector**: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`

**Metrics Breakdown**:

- Attack Vector: Network
- Attack Complexity: Low
- Privileges Required: None
- User Interaction: None
- Scope: Unchanged
- Confidentiality: High
- Integrity: High
- Availability: High

**Results**:

- CVSS Base Score: **9.8**
- Severity: **CRITICAL**
- BugHuntr Score: **21.6** (9.8 × 2.0 × 1.1)
- Asset Multiplier: 2.0x (payment system)
- Reward Tier: **CRITICAL**
- Estimated Payout: **$10,000+** (organization policy)
- CVE Eligible: ✅ Yes

---

## 🔧 Technical Implementation

### CVSS Base Score Formula

```javascript
// Impact calculation
const isc = 1 - (1 - C) * (1 - I) * (1 - A);

if (scope === "Unchanged") {
  impact = 6.42 * isc;
} else {
  impact = 7.52 * (isc - 0.029) - 3.25 * Math.pow(isc - 0.02, 15);
}

// Exploitability calculation
exploitability = 8.22 * AV * AC * PR * UI;

// Base score
if (scope === "Changed") {
  baseScore = Math.min(1.08 * (impact + exploitability), 10.0);
} else {
  baseScore = Math.min(impact + exploitability, 10.0);
}

// Round up to 1 decimal place
baseScore = Math.ceil(baseScore * 10) / 10;
```

### BugHuntr Score Formula

```javascript
bugHuntrScore = cvssBaseScore
  × assetMultiplier
  × exploitabilityFactor
  × pocBonus;

// Example:
// 9.8 × 2.0 (payment) × 1.0 × 1.1 (PoC) = 21.56
```

### Reward Tier Mapping

```javascript
function getRewardTier(bugHuntrScore) {
  if (bugHuntrScore >= 9.0) return "CRITICAL";
  if (bugHuntrScore >= 7.0) return "HIGH";
  if (bugHuntrScore >= 4.0) return "MEDIUM";
  if (bugHuntrScore >= 1.0) return "LOW";
  return "INFO";
}
```

---

## 🎮 Using the Demo

### Step 1: Access Demo Page

Navigate to `/cvss-demo` in your browser.

### Step 2: Build a Vector

1. Select metrics from dropdowns in the Vector Builder
2. Watch the score update in real-time
3. Copy the generated vector string

### Step 3: Adjust Business Context

1. Choose the affected asset type
2. Toggle PoC availability
3. See BugHuntr score adjustment

### Step 4: View Reward Estimate

1. Check the assigned tier
2. View estimated payout
3. Verify CVE eligibility

### Step 5: Try Examples

1. Switch to "Example Vulnerabilities" tab
2. Click any example to load it
3. Explore different vulnerability types

---

## 🔍 Testing the Workflow

### End-to-End Flow

1. **Submit Bug** → `/submit`

   - Reporter submits vulnerability details
   - System auto-generates suggested CVSS vector

2. **Triage Review** → `/admin/vulnerability/[vulnId]`

   - Triager reviews suggested vector
   - Can edit metrics via interactive editor
   - Approves final CVSS score

3. **CVE Decision** → `/admin/cve-requests`

   - Admin reviews approved vulnerabilities
   - Decides if CVE-worthy (score ≥ 7.0)
   - Submits CVE request if eligible

4. **Payout Processing**
   - System calculates reward based on tier
   - Creates payout record
   - Tracks payment status

### Test Data

Use these test vulnerability IDs:

- `DEMO-001`: Critical SQL Injection (10.0)
- `DEMO-002`: Medium XSS (5.4)
- `DEMO-003`: Critical RCE (9.8)
- `DEMO-004`: Medium Info Disclosure (5.3)
- `DEMO-005`: Medium CSRF (6.5)

---

## 📊 Metrics & Definitions

### Attack Vector (AV)

- **Network (N)**: Remotely exploitable over network
- **Adjacent (A)**: Requires local network access
- **Local (L)**: Requires local system access
- **Physical (P)**: Requires physical device access

### Attack Complexity (AC)

- **Low (L)**: No special conditions needed
- **High (H)**: Requires specific timing, race conditions, etc.

### Privileges Required (PR)

- **None (N)**: No authentication needed
- **Low (L)**: Basic user account required
- **High (H)**: Admin/privileged account required

### User Interaction (UI)

- **None (N)**: Fully automated exploit
- **Required (R)**: Requires user action (click, view, etc.)

### Scope (S)

- **Unchanged (U)**: Exploits within same security authority
- **Changed (C)**: Breaks authorization boundaries

### Impact Metrics (C/I/A)

- **High (H)**: Total loss of resource
- **Low (L)**: Partial loss of resource
- **None (N)**: No impact to resource

---

## 🚀 Advanced Features

### Custom Scoring Policies

Organizations can define custom policies:

```typescript
interface OrgPayoutPolicy {
  assetMultipliers: Record<string, number>;
  tierThresholds: {
    critical: number; // e.g., 9.0
    high: number; // e.g., 7.0
    medium: number; // e.g., 4.0
    low: number; // e.g., 1.0
  };
  rewardRanges: {
    critical: { min: number; max: number };
    high: { min: number; max: number };
    medium: { min: number; max: number };
    low: { min: number; max: number };
    info: { min: number; max: number };
  };
}
```

### Audit Trail

Every CVSS change is logged:

- Actor UID and email
- Timestamp
- Old vector → New vector
- Vector diff (which metrics changed)
- Approval notes
- Final sign-off indicator

### CVE Integration

Automatic CVE request creation:

- Populates CVE form with vulnerability data
- Includes CVSS vector and score
- Tracks submission status
- Links to assigned CVE-ID

---

## 📚 Resources

### Official Documentation

- [NIST CVSS v3.1 Specification](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-126r3.pdf)
- [FIRST CVSS Calculator](https://www.first.org/cvss/calculator/3.1)
- [CVE Program](https://www.cve.org/)

### BugHuntr Docs

- `/docs/CVSS_AND_CVE_README.md` - Implementation overview
- `/docs/CVSS_FIRESTORE_SCHEMA.md` - Database schema
- `/docs/CVSS_FIRESTORE_RULES.md` - Security rules
- `/docs/PAYOUT_SYSTEM_README.md` - Reward system

### API Endpoints

Cloud Functions:

- `createSuggestedCvss(submissionId)` - Generate initial vector
- `approveCvssVector(vulnId, vector, notes, finalSignOff)` - Approve score
- `requestCveAssignment(vulnId)` - Request CVE ID
- `computeBugHuntrScore(cvssBase, factors)` - Calculate adjusted score

---

## 🐛 Troubleshooting

### Common Issues

**Q: Why is my score different from FIRST calculator?**
A: Ensure you're using CVSS v3.1 (not v3.0 or v2.0). Check for rounding differences.

**Q: BugHuntr score seems too high/low?**
A: Check your asset multiplier and PoC bonus settings. These can significantly affect the final score.

**Q: CVE request not showing up?**
A: Verify the vulnerability has:

- Approved CVSS vector (status = 'cvss_approved')
- Base score ≥ 7.0
- No existing CVE request

**Q: Reward estimate doesn't match payout?**
A: Estimates are baselines. Organizations set custom policies that may differ.

---

## 🎓 Best Practices

### For Security Researchers

1. **Provide PoC**: +10% reward bonus
2. **Target Critical Assets**: 1.5x - 2.0x multipliers
3. **Detailed Reports**: Helps triagers assign accurate scores
4. **Responsible Disclosure**: Required for CVE eligibility

### For Triagers

1. **Review Suggested Vectors**: Auto-generation is a starting point
2. **Consider Business Context**: Apply appropriate asset multipliers
3. **Document Changes**: Add clear notes in audit trail
4. **Verify Exploitability**: Test PoCs when available

### For Admins

1. **Set Clear Policies**: Define asset multipliers and reward ranges
2. **Monitor CVE Pipeline**: Track pending requests
3. **Review High-Value**: Extra scrutiny on CRITICAL tier
4. **Update Multipliers**: Adjust based on organizational risk

---

## 📝 Changelog

### v1.0.0 - Initial Release

- CVSS v3.1 base score calculation
- BugHuntr scoring with multipliers
- Reward tier mapping
- CVE request workflow
- Interactive demo page
- Complete documentation

---

## 🤝 Support

For questions or issues:

- Check `/docs` directory for detailed documentation
- Review example vulnerabilities in demo
- Contact admin team for policy questions

---

**Demo built with**: Next.js 15, React 19, TypeScript, shadcn/ui, Firebase

**Compliance**: NIST SP 800-126 Rev. 3, CVE Program guidelines

**Last Updated**: December 2025
