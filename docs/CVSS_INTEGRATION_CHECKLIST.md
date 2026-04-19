# CVSS & CVE Module - Integration Checklist

Follow this checklist to integrate the CVSS scoring and CVE request workflow into your BugHuntr codebase.

## Phase 1: Core Engine Setup (Week 1)

### Code Files Created

- [x] `functions/src/cvss/cvssEngine.ts` — CVSS v3.1 parser & base score calculator
- [x] `functions/src/cvss/bughuntrScoring.ts` — Internal scoring formula
- [x] `functions/src/utils/validateCvssVector.ts` — Validation helpers
- [ ] **TODO**: Update `functions/src/index.ts` to export these modules

### Configuration

- [ ] Set up Firestore collections (create docs manually or via emulator):

  - `orgs/{YOUR_ORG_ID}` with `payoutPolicy` and `assetImportanceMap`
  - Sample `vulnerabilities/{TEST}` document for testing

- [ ] Review and copy Firestore rules from `docs/CVSS_FIRESTORE_RULES.md`
  - Ensure custom claims (role, org) are set up in your auth system
  - Test in emulator before production deployment

### Testing

- [ ] Run unit tests:
  ```bash
  npm test -- functions/src/__tests__/cvss/
  ```
  - All CVSS vector parsing tests pass
  - All scoring tests pass
  - All validation tests pass

### Documentation

- [x] CVSS v3.1 implementation documented in `docs/CVSS_AND_CVE_README.md`
- [x] Firestore schema documented in `docs/CVSS_FIRESTORE_SCHEMA.md`

---

## Phase 2: Triage Workflow (Week 2-3)

### Cloud Functions

- [ ] `functions/src/functions/cvss/createSuggestedCvss.ts`

  - [ ] Deploy function
  - [ ] Test with emulator: call `createSuggestedCvss({ submissionId: 'test' })`
  - [ ] Verify Firestore records created in `vulnerabilities/{vulnId}`

- [ ] `functions/src/functions/cvss/approveCvss.ts`

  - [ ] Deploy function
  - [ ] Test triager approval workflow
  - [ ] Verify audit entries created
  - [ ] Verify vector diffs calculated

- [ ] `functions/src/functions/cvss/decideRewardAndPayoutDecision.ts`
  - [ ] Deploy function
  - [ ] Link from `approveCvss` (call on `finalSignOff=true`)
  - [ ] Test reward tier assignment
  - [ ] Verify payouts collection updates

### Frontend Components

- [ ] Create `components/triage/TriageCvssEditor.tsx`

  - [ ] Add to triage page
  - [ ] Test metric dropdown edits
  - [ ] Test approval flow
  - [ ] Verify sign-off modal

- [ ] Create `components/triage/SubmitBugCvssPreview.tsx`
  - [ ] Add to bug submission form
  - [ ] Test preview calculations
  - [ ] Verify reward tier display

### Pages

- [ ] Create or update triager dashboard:
  - [ ] List vulnerabilities with `status: triage_pending`
  - [ ] Link to `TriageCvssEditor` component
  - [ ] Show suggested score + triage time estimate

### Testing

- [ ] Integration test: submission → suggestion → approval → reward decision
  ```bash
  npm test -- integration/cvss-workflow.test.ts
  ```

---

## Phase 3: CVE Workflow (Week 4)

### Cloud Functions

- [ ] `functions/src/functions/cve/requestCve.ts`

  - [ ] Deploy function
  - [ ] Test CVE request creation
  - [ ] Verify status: `requested`
  - [ ] Verify disclosure packet saved

- [ ] `functions/src/functions/cve/checkCveAssignment.ts`
  - [ ] Implement as scheduled Cloud Function (hourly)
  - [ ] TODO: Integrate with real CNA API (MITRE, NVD, etc.)
  - [ ] For MVP: provide manual status update UI

### Frontend Pages

- [ ] Admin page: `pages/admin/cveRequests.tsx` (or integrate into admin dashboard)

  - [ ] List pending CVE requests
  - [ ] Show request details (vuln, timeline, disclosure type)
  - [ ] Forms to:
    - [ ] Send request to CNA (with email)
    - [ ] Mark as "CNA Acknowledged"
    - [ ] Update with CVE ID
    - [ ] Mark as "Public"
    - [ ] Reject request
  - [ ] Export CVE JSON button

- [ ] Vulnerability detail page: `pages/admin/vulnerability/:vulnId.tsx` (if new)
  - [ ] Embed `TriageCvssEditor`
  - [ ] Show CVE request status if exists
  - [ ] Button to "Request CVE"

### Testing

- [ ] Integration test: triage → CVE request → status tracking

---

## Phase 4: Integration with Existing Systems (Week 5)

### Payout System Integration

- [ ] Coordinate with existing `createPayout` function
  - [ ] Ensure `decideRewardAndPayoutDecision` creates compatible payout records
  - [ ] Verify `payouts` collection schema alignment
  - [ ] Test end-to-end: triage → payout creation → disbursement

### Bug Submission Form

- [ ] Add CVSS preview component (`SubmitBugCvssPreview`)
  - [ ] Appears during form submission
  - [ ] Uses heuristics or calls backend for estimates
  - [ ] Shows estimated reward tier

### Hunter Notifications

- [ ] TODO: Email when submission gets CVSS suggestion

  - [ ] Template: "Your submission has been reviewed and scored as [SEVERITY]"
  - [ ] Include estimated reward (if applicable)

- [ ] TODO: Email when CVSS is approved

  - [ ] Template: "Triage complete: CVSS [score], Reward: $X"
  - [ ] Link to check status

- [ ] TODO: Email if auto-rejected (low severity)
  - [ ] Template: "Low severity notice - below reward threshold"
  - [ ] Include appeal/review link

### Admin Dashboard

- [ ] Add widget showing:
  - [ ] Pending triage count
  - [ ] Avg triage time
  - [ ] Recent scores distribution (chart)

---

## Phase 5: Production Hardening (Week 6)

### Security

- [ ] Review and deploy Firestore security rules

  - [ ] Test in emulator with multiple user roles
  - [ ] Verify audit trail immutability
  - [ ] Verify triager-only field access

- [ ] Set up Cloud Functions secret management:
  - [ ] CNA API keys (if integrating)
  - [ ] Email service credentials
  - [ ] Use Google Secret Manager or Functions config

### Monitoring & Logging

- [ ] Add structured logging to Cloud Functions:

  ```typescript
  console.log(
    JSON.stringify({
      function: "createSuggestedCvss",
      vulnId,
      score: result.bughuntrScore,
      timestamp: new Date().toISOString(),
    })
  );
  ```

- [ ] Set up alerts for:

  - [ ] High error rates in CVSS functions
  - [ ] Unusual auto-rejection rates
  - [ ] CVE request processing delays

- [ ] Create Firestore metrics:
  - [ ] # of vulnerabilities triaged/day
  - [ ] Avg time from submission to triage
  - [ ] Distribution of BugHuntr scores

### Documentation

- [ ] Create runbook for:

  - [ ] Triager onboarding (how to use triage editor)
  - [ ] Admin manual CVE status updates
  - [ ] Troubleshooting common issues

- [ ] Record demo video:
  - [ ] Bug submission with CVSS preview
  - [ ] Triager reviewing and approving CVSS
  - [ ] CVE request workflow

---

## Phase 6: CNA Integration (Future)

### Research & Planning

- [ ] [ ] Contact MITRE to become a CNA (or partner with one)
- [ ] [ ] Review CNA requirements and procedures
- [ ] [ ] Document API for CVE assignment

### Implementation

- [ ] [ ] Implement real CNA API integration in `checkCveAssignment.ts`
- [ ] [ ] Implement webhook handler for CNA callbacks
- [ ] [ ] Implement CVE export in CNA-standard format

---

## Testing Checklist

### Unit Tests

- [ ] CVSS vector parsing (valid/invalid)
- [ ] Base score calculation (all severity ranges)
- [ ] Heuristic suggestions (all vuln types)
- [ ] BugHuntr score multipliers
- [ ] Reward tier mapping
- [ ] Payout eligibility logic

### Integration Tests

- [x] Submission → Suggested CVSS
- [x] Suggested CVSS → Approval with edits
- [x] Approval → Reward decision
- [x] CVE request creation
- [ ] Concurrent edits (transaction safety)
- [ ] Status transitions (valid/invalid)

### Manual Testing (in emulator)

- [ ] Admin can view suggested CVSS
- [ ] Triager can edit vector
- [ ] Signature of approval creates audit trail
- [ ] Hunter sees reward tier estimate
- [ ] Low-severity auto-rejection workflow
- [ ] CVE request status tracking

### Production Testing

- [ ] Staging environment end-to-end test
- [ ] Load test: 100 concurrent CVSS suggestions
- [ ] Firestore query performance (audit trails)
- [ ] Email delivery for notifications

---

## Deployment Steps

### Pre-Deployment

```bash
# 1. Run full test suite
npm test

# 2. Check code coverage (target: >80%)
npm test -- --coverage

# 3. Lint and format
npm run lint
npm run format

# 4. Build functions
cd functions
npm run build

# 5. Test with emulator
firebase emulators:start
npm test -- integration/
```

### Deployment

```bash
# 1. Deploy Cloud Functions
firebase deploy --only functions

# 2. Deploy Firestore rules (after backup)
firebase deploy --only firestore:rules

# 3. Create/update Firestore indexes
firebase firestore:indexes:deploy

# 4. Verify deployment
firebase functions:log
```

### Post-Deployment

- [ ] Smoke test: create test submission, verify suggestion created
- [ ] Monitor error logs: `firebase functions:log`
- [ ] Check Firestore metrics
- [ ] Send announcement to triagers about new feature

---

## Known Issues & TODOs

### High Priority

- [ ] **CNA Integration**: Currently no real CNA API calls. Manual or email-based for MVP.
- [ ] **Machine Learning**: Heuristics are rule-based. ML model would improve suggestions.
- [ ] **Temporal Metrics**: Only CVSS base score. Temporal scores needed for future updates.

### Medium Priority

- [ ] **Bulk Triage**: No bulk approval UI. Triagers approve one at a time.
- [ ] **Appeal Process**: Low-severity auto-rejections can't be appealed yet.
- [ ] **Internationalization**: All UI text in English only.

### Low Priority

- [ ] **Graphical Vector Editor**: Current is dropdown-based. Could be more visual.
- [ ] **Historical Analysis**: No dashboard showing score trends over time.
- [ ] **Export Formats**: Only JSON. Could add CSV, PDF, etc.

---

## Support & Questions

- **CVSS Spec**: https://www.first.org/cvss/v3.1/specification-document
- **BugHuntr Docs**: See `docs/CVSS_AND_CVE_README.md`
- **Firestore Schema**: See `docs/CVSS_FIRESTORE_SCHEMA.md`
- **Slack/Email**: Reach out to security team for questions

---

## Rollback Plan

If issues arise in production:

1. **Disable CVE requests**: Set `cveAutoRequestEnabled = false` in all orgs
2. **Pause auto-suggestions**: Disable `createSuggestedCvss` Cloud Function
3. **Restore from backup**: Firebase has automatic backups
4. **Revert code**: Roll back to previous Cloud Functions deployment
5. **Communicate**: Notify triagers and hunters of temporary outage

---

**Last Updated**: December 9, 2025  
**Status**: MVP Ready  
**Next Phase**: CNA Integration (Q1 2025)
