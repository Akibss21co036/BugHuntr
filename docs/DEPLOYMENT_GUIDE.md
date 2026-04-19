# CVSS & CVE Workflow - Deployment Guide

## Overview

This guide covers deploying the production-ready CVSS scoring + CVE request workflow to your BugHuntr instance. The system includes:

- **CVSS v3.1 engine** with base score calculation
- **BugHuntr internal scoring** formula with multipliers
- **Triage workflow** with approval and audit trail
- **Reward decision automation** based on severity
- **CVE request workflow** with disclosure management
- **Admin dashboards** for triagers and admins
- **Firestore security rules** with role-based access

## Pre-Deployment Checklist

### 1. Environment Setup

```bash
# Verify Node.js version (required: 18+)
node --version

# Verify Firebase CLI installed
firebase --version

# Verify pnpm (or npm) installed
pnpm --version
```

### 2. Code Files Present

Verify all files have been created in your workspace:

**Cloud Functions** (in `functions/src/`):

- ✅ `cvss/cvssEngine.ts` (CVSS v3.1 implementation)
- ✅ `cvss/bughuntrScoring.ts` (scoring formula)
- ✅ `utils/validateCvssVector.ts` (validation utilities)
- ✅ `functions/cvss/createSuggestedCvss.ts` (auto-suggestion callable)
- ✅ `functions/cvss/approveCvss.ts` (approval callable)
- ✅ `functions/cvss/decideRewardAndPayoutDecision.ts` (reward decision)
- ✅ `functions/cve/requestCve.ts` (CVE request callable)

**Frontend Components** (in `components/` and `app/`):

- ✅ `components/triage/TriageCvssEditor.tsx` (triager UI)
- ✅ `components/triage/SubmitBugCvssPreview.tsx` (hunter preview)
- ✅ `app/admin/cve-requests/page.tsx` (CVE dashboard)
- ✅ `app/admin/vulnerability/[vulnId]/page.tsx` (detail page)

**Tests** (in `functions/src/__tests__/`):

- ✅ `cvss/cvssEngine.test.ts` (CVSS unit tests)
- ✅ `cvss/bughuntrScoring.test.ts` (scoring unit tests)
- ✅ `integration/cvss-workflow.test.ts` (integration test suite)

**Hooks** (in `hooks/`):

- ✅ `use-vulnerability.ts` (vulnerability data hook)

**Documentation** (in `docs/`):

- ✅ `CVSS_AND_CVE_README.md` (main documentation)
- ✅ `CVSS_FIRESTORE_SCHEMA.md` (schema reference)
- ✅ `CVSS_FIRESTORE_RULES.md` (security rules)
- ✅ `CVSS_INTEGRATION_CHECKLIST.md` (integration guide)

### 3. Dependencies Installed

```bash
# Install Cloud Functions dependencies
cd functions
pnpm install

# Verify these packages are present:
# - firebase-functions
# - firebase-admin
# - @types/jest (for testing)
# - @types/node

cd ..

# Install frontend dependencies
pnpm install

# Verify these packages are present:
# - firebase
# - next
# - react
```

### 4. Firebase Project Configured

```bash
# Initialize Firebase (if not already done)
firebase init functions firestore

# Verify firebase.json exists and contains:
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}

# Set default Firebase project
firebase use --add
# Select your project from the list
```

## Phase 1: Local Testing with Emulator

### Step 1: Start Firebase Emulator

```bash
# In workspace root
firebase emulators:start

# Wait for output:
# ✔  Firestore Emulator running on 127.0.0.1:8080
# ✔  Firebase Auth emulator running on 127.0.0.1:9099
# ✔  Cloud Functions running on 127.0.0.1:5001
```

### Step 2: Run Unit Tests

```bash
# In functions directory
cd functions

# Run CVSS engine tests
pnpm test -- src/__tests__/cvss/cvssEngine.test.ts

# Run scoring tests
pnpm test -- src/__tests__/cvss/bughuntrScoring.test.ts

# Run all tests
pnpm test

# Expected output:
# PASS  src/__tests__/cvss/cvssEngine.test.ts (850ms)
#   CVSS v3.1 Engine
#     ✓ should parse CVSS vector string with prefix (45ms)
#     ✓ should compute base score for critical RCE (12ms)
#     ... (10+ tests)
#
# PASS  src/__tests__/cvss/bughuntrScoring.test.ts (720ms)
#   BugHuntr Scoring Formula
#     ✓ should compute BugHuntr score with multipliers (8ms)
#     ✓ should map score to reward tier (5ms)
#     ... (13+ tests)
#
# Test Suites: 2 passed, 2 total
# Tests:       25 passed, 25 total
```

### Step 3: Build Cloud Functions

```bash
cd functions

# Build TypeScript
pnpm run build

# Expected output:
# Successfully compiled 7 Cloud Functions

# Check output directory
ls -la lib/
# Should contain .js files matching .ts files
```

### Step 4: Deploy to Emulator

```bash
# Deploy to local emulator
firebase emulators:exec "firebase deploy --only functions"

# Expected output:
# ✔  Deploy complete!
# Function URL: http://localhost:5001/YOUR-PROJECT/us-central1/createSuggestedCvss
# ... (other function URLs)
```

### Step 5: Test with Sample Data

```bash
# In emulator, create test org
# Use Firestore Emulator UI: http://localhost:4000

# Create document: orgs/{your-org-id}
{
  "payoutPolicy": {
    "minScoreToPay": 4.0,
    "baseRewardAmount": 200,
    "tierMultipliers": {
      "CRITICAL": 2.0,
      "HIGH": 1.5,
      "MEDIUM": 1.0,
      "LOW": 0.25
    }
  },
  "assetImportanceMap": {
    "payment_system": 2.0,
    "authentication": 1.8,
    "web_app": 1.2,
    "staging": 0.5
  }
}

# Create test submission: bug_submissions/{test-submission-1}
{
  "title": "SQL Injection in Login",
  "description": "Login form vulnerable to SQL injection attacks",
  "vulnerabilityType": "SQL Injection",
  "assetType": "web_app",
  "pocAvailable": true,
  "pocType": "code",
  "reporterUid": "test-hunter",
  "reporterEmail": "hunter@example.com",
  "orgId": "your-org-id",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

## Phase 2: Production Deployment

### Step 1: Review & Configure Organization Settings

```bash
# In Firebase Console: Firestore → Collections → orgs

# For each organization, create/update document with:
{
  "payoutPolicy": {
    "minScoreToPay": 4.0,                    # Auto-reject below this score
    "baseRewardAmount": 200,                  # Base reward in USD
    "tierMultipliers": {
      "CRITICAL": 2.0,
      "HIGH": 1.5,
      "MEDIUM": 1.0,
      "LOW": 0.25
    }
  },
  "assetImportanceMap": {
    "payment_system": 2.0,
    "authentication": 1.8,
    "web_app": 1.2,
    "api": 1.5,
    "staging": 0.5
  },
  "cveConsentGiven": true,                   # For coordinated disclosure
  "cveDisclosureDeadline": 90                # Days for coordinated disclosure
}
```

### Step 2: Deploy Cloud Functions

```bash
# Build functions
cd functions
pnpm run build
cd ..

# Deploy only CVSS functions (safe approach)
firebase deploy --only functions:createSuggestedCvss
firebase deploy --only functions:approveCvss
firebase deploy --only functions:decideRewardAndPayoutDecision
firebase deploy --only functions:requestCve

# Or deploy all functions at once
firebase deploy --only functions

# Expected output:
# ✔  Deploy complete!
# ✔  Function URL (us-central1): https://us-central1-YOUR-PROJECT.cloudfunctions.net/createSuggestedCvss
# ✔  Function URL (us-central1): https://us-central1-YOUR-PROJECT.cloudfunctions.net/approveCvss
# ...

# Verify deployment
firebase functions:list
```

### Step 3: Deploy Firestore Rules

```bash
# Backup current rules first
firebase firestore:backups create \
  --backup-location=us \
  --display-name="Pre-CVSS-Rules-$(date +%s)"

# Deploy new rules (from CVSS_FIRESTORE_RULES.md)
firebase deploy --only firestore:rules

# Expected output:
# ✔  Deploy complete!
# i  firestore: rules deployed successfully
```

### Step 4: Create Firestore Indexes

```bash
# Check if indexes are needed
firebase firestore:indexes

# Deploy indexes (from CVSS_FIRESTORE_SCHEMA.md)
firebase deploy --only firestore:indexes

# Expected output:
# ✔  Deploy complete!
# ✔  Indexes deployed successfully
```

### Step 5: Deploy Next.js Frontend

```bash
# Build Next.js application
pnpm run build

# Expected output:
# ✓ Compiled successfully

# Deploy to Firebase Hosting (if configured)
firebase deploy --only hosting

# Or deploy to your preferred platform (Vercel, etc.)
```

### Step 6: Smoke Test

```bash
# Test in production environment

# 1. Create a test vulnerability submission
# 2. Verify suggested CVSS appears in admin dashboard
# 3. Test CVSS approval workflow
# 4. Verify payout record created
# 5. Test CVE request creation

# Monitor logs
firebase functions:log

# Expected output:
# createSuggestedCvss: Created BH-VULN-test-001 with score 8.5
# approveCvss: Approved BH-VULN-test-001 with score 8.5
# decideRewardAndPayoutDecision: Created payout BH-PAYOUT-001 for $400
# requestCve: Created CVE request BH-CVE-BH-VULN-test-001
```

## Phase 3: Triager Onboarding

### 1. Grant Firestore Custom Claims

```javascript
// In Cloud Functions or Firebase Admin SDK
const admin = require("firebase-admin");

async function setTriagerRole(uid, orgId) {
  await admin.auth().setCustomUserClaims(uid, {
    role: "triager",
    org: orgId,
  });
  console.log(`Set triager role for ${uid}`);
}

// Call for each triager
await setTriagerRole("triager-uid-1", "your-org-id");
```

### 2. Create Triage Dashboard

```bash
# The dashboard is already created at:
# /admin/vulnerability - List pending vulnerabilities
# /admin/cve-requests - Manage CVE requests

# Train triagers on:
# 1. CVSS metric selection (AV, AC, PR, UI, S, C, I, A)
# 2. Vector validation
# 3. Approval workflow
# 4. Audit trail review
```

### 3. Set Up Email Notifications

```bash
# TODO: Configure email templates for:
# - Vulnerability auto-suggested (to triagers)
# - CVSS approved (to hunters)
# - CVE request submitted (to admins)
# - Payout created (to hunters)

# Use Firebase Cloud Functions with:
# - SendGrid, Mailgun, or AWS SES
# - Email templates in Firestore or Cloud Storage
# - Scheduled function to batch notifications
```

## Phase 4: Monitoring & Alerts

### 1. Enable Cloud Monitoring

```bash
# In Google Cloud Console:
# 1. Navigate to Cloud Monitoring → Dashboards
# 2. Create dashboard: "CVSS Workflow Monitoring"
# 3. Add charts:
#    - Cloud Functions invocations (by function name)
#    - Function error rates
#    - Function latency (p50, p95, p99)
#    - Firestore document read/write counts
#    - Firestore query latency

# 4. Create alerts:
#    - Function error rate > 1%
#    - Function latency > 5s
#    - Firestore reads > 10k/day
```

### 2. View Logs

```bash
# Real-time logs
firebase functions:log

# Structured logs
gcloud functions describe createSuggestedCvss --gen2 --logs

# Export logs to BigQuery for analysis
gcloud logging sinks create cvss-bigquery \
  bigquery.googleapis.com/projects/YOUR-PROJECT/datasets/logs \
  --log-filter='resource.type="cloud_function" AND resource.labels.function_name=~"^(createSuggestedCvss|approveCvss|.*)"'
```

### 3. Set Up Uptime Monitoring

```bash
# Monitor critical endpoints
gcloud monitoring uptime-checks create cvss-api \
  --display-name="CVSS API Health" \
  --resource-type="uptime-url" \
  --monitored-resource="https://us-central1-YOUR-PROJECT.cloudfunctions.net/createSuggestedCvss"
```

## Phase 5: Maintenance & Operations

### Weekly Tasks

```bash
# 1. Review function logs for errors
firebase functions:log | grep ERROR

# 2. Check Firestore quota usage
gcloud firestore databases describe default --format="table(name, version)"

# 3. Verify audit trail completeness
firebase firestore:backups list

# 4. Check pending CVE requests
# Via admin dashboard: /admin/cve-requests
```

### Monthly Tasks

```bash
# 1. Review CVSS suggestion accuracy
#    - Count auto-rejected vs. approved
#    - Analyze suggested vs. approved vector differences
#    - Identify heuristic improvements

# 2. Audit trail analysis
#    - Export audit logs
#    - Verify immutability
#    - Check for anomalies

# 3. Performance optimization
#    - Review Firestore index usage
#    - Optimize slow queries
#    - Adjust Cloud Function memory if needed

# 4. Security review
#    - Verify Firestore rules are enforced
#    - Check custom claims validity
#    - Review access logs
```

### Quarterly Tasks

```bash
# 1. CVSS heuristic tuning
#    - Review suggestion accuracy
#    - Train ML model (if available)
#    - Update scoring multipliers

# 2. CNA integration assessment
#    - Review CVE assignment rates
#    - Identify automation opportunities
#    - Plan CNA API integration

# 3. Cost optimization
#    - Review Cloud Functions pricing
#    - Optimize Firestore queries
#    - Consider reserved capacity
```

## Troubleshooting

### Issue: CVSS Vector Validation Fails

**Problem**: `Error: Invalid CVSS vector format`

**Solution**:

1. Check vector format: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H`
2. Verify all 8 metrics present: AV, AC, PR, UI, S, C, I, A
3. Check metric values against CVSS v3.1 spec
4. Review `validateCvssVector()` in `functions/src/utils/validateCvssVector.ts`

### Issue: Low Auto-Rejection Rate Too High

**Problem**: Too many vulnerabilities auto-rejected as low-severity

**Solution**:

1. Review `payoutPolicy.minScoreToPay` setting (default: 4.0)
2. Check asset importance multipliers
3. Analyze rejected submissions for patterns
4. Adjust heuristics in `suggestVectorFromSubmission()` if needed
5. Consider manual appeals process

### Issue: CVE Request Status Not Updating

**Problem**: CVE requests stuck in `requested` status

**Solution**:

1. Verify CNA integration (currently manual)
2. Check audit trail for error messages
3. Verify Firestore rules allow status updates
4. Check custom claims for triager role
5. Review `requestCve()` function logs

### Issue: Payout Amount Seems Wrong

**Problem**: Calculated reward doesn't match expected

**Solution**:

1. Verify org payout policy settings (base amount, multipliers)
2. Check asset importance map for correct multiplier
3. Review reward tier calculation in `mapScoreToRewardTier()`
4. Check BugHuntr score computation with multipliers
5. Verify no override settings in payout record

### Issue: Performance Degradation

**Problem**: Slow CVSS computation or Firestore queries

**Solution**:

1. Check Cloud Functions memory (increase if needed)
2. Review Firestore indexes: `firebase firestore:indexes`
3. Monitor query performance: Google Cloud Console → Firestore → Performance
4. Optimize heuristic suggestions (cache common patterns)
5. Consider batching updates during high load

## Rollback Plan

If critical issues discovered:

### Immediate Rollback

```bash
# 1. Disable CVSS auto-suggestions
# Set org.cvssAutoSuggestionEnabled = false

# 2. Disable payout auto-decisions
# Set org.payoutAutoDecisionEnabled = false

# 3. Stop CVE requests
# Disable CVE request UI or require manual approval

# 4. Revert Cloud Functions
firebase deploy --only functions --version previous

# 5. Revert Firestore rules
firebase deploy --only firestore:rules --version previous
```

### Full Rollback

```bash
# 1. Restore Firestore from backup
firebase firestore:backups restore \
  "projects/YOUR-PROJECT/locations/us/backups/BACKUP-ID"

# 2. Revert all code changes
git revert HEAD

# 3. Deploy previous version
firebase deploy

# 4. Verify functionality
firebase emulators:exec "pnpm test"
```

## Support & Resources

- **CVSS Specification**: https://www.first.org/cvss/v3.1/specification-document
- **Firebase Documentation**: https://firebase.google.com/docs
- **Cloud Functions Guide**: https://cloud.google.com/functions/docs
- **Firestore Best Practices**: https://firebase.google.com/docs/firestore/best-practices
- **Internal Docs**: See `docs/` folder (CVSS_AND_CVE_README.md, CVSS_FIRESTORE_SCHEMA.md, etc.)

## Next Steps

1. ✅ Deploy Cloud Functions
2. ✅ Deploy Firestore rules & indexes
3. ✅ Deploy Next.js frontend
4. 🔄 Train triagers on CVSS workflow
5. 🔄 Set up email notifications
6. 🔄 Configure CNA integration (Phase 2)
7. 🔄 Implement ML-based suggestions (Phase 3)

---

**Last Updated**: December 9, 2025  
**Status**: Production Ready  
**Contact**: Security Team  
**Slack Channel**: #cvss-workflow-support
