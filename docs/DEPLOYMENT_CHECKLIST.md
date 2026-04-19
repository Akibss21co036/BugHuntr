# BugHuntr Crypto Payout System - Deployment Checklist

## Pre-Deployment

### 1. Cryptomus Setup ✅

- [ ] Create Cryptomus merchant account
- [ ] Complete KYC verification
- [ ] Obtain Merchant ID
- [ ] Generate Payout API Key
- [ ] Test with sandbox/test mode
- [ ] Configure webhook URL in Cryptomus dashboard
- [ ] Verify webhook signature method with documentation

### 2. Firebase Project Setup ✅

- [ ] Create/Select Firebase project
- [ ] Enable Firestore
- [ ] Enable Cloud Functions
- [ ] Enable Cloud Scheduler (for reconciliation)
- [ ] Set up billing (required for external API calls)
- [ ] Configure authentication

### 3. Development Environment ✅

- [ ] Install Node.js 18+ LTS
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Clone repository
- [ ] Install dependencies: `cd functions && npm install`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Configure local environment variables

## Configuration

### 4. Firebase Functions Config ✅

```bash
# Required - Cryptomus credentials
firebase functions:config:set \
  cryptomus.merchant_id="YOUR_MERCHANT_ID" \
  cryptomus.payout_key="YOUR_PAYOUT_API_KEY"

# Optional - Sandbox mode (set to "false" for production)
firebase functions:config:set cryptomus.use_sandbox="true"

# Optional - Custom webhook URL (auto-generated if not set)
firebase functions:config:set \
  cryptomus.webhook_url="https://us-central1-PROJECT_ID.cloudfunctions.net/cryptomusWebhook"

# Verify configuration
firebase functions:config:get
```

### 5. Firestore Setup ✅

- [ ] Deploy Firestore security rules
- [ ] Create initial org wallet documents
- [ ] Set up indexes (if needed)
- [ ] Configure backup schedule

**Create Org Wallet Example:**

```javascript
// In Firestore console or via script
db.collection("org_wallets").doc("org_YOUR_ORG_ID").set({
  orgId: "org_YOUR_ORG_ID",
  currency: "USDC",
  network: "POLYGON",
  balance: 0,
  reserved: 0,
  updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
});
```

### 6. Security Rules ✅

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Verify rules in Firebase Console
# Test rules with Firebase Emulator
```

## Build & Test

### 7. Local Testing ✅

```bash
# Build functions
cd functions
npm run build

# Run tests
npm test

# Start emulator
npm run serve

# Test webhook locally
curl -X POST http://localhost:5001/PROJECT_ID/us-central1/cryptomusWebhook \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

### 8. Code Quality ✅

- [ ] Run linter: `npm run lint`
- [ ] Fix all TypeScript errors
- [ ] Review security rules
- [ ] Test all Cloud Functions
- [ ] Verify webhook signature logic
- [ ] Test transaction rollbacks

## Deployment

### 9. Initial Deployment ✅

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy individually
firebase deploy --only functions:createPayout
firebase deploy --only functions:cryptomusWebhook
firebase deploy --only functions:reconcilePayouts
firebase deploy --only functions:createBatchPayouts
firebase deploy --only functions:processQueuedPayout
```

### 10. Verify Deployment ✅

```bash
# List deployed functions
firebase functions:list

# Check function URLs
# Should see:
# - createPayout (callable)
# - cryptomusWebhook (http)
# - reconcilePayouts (scheduled)
# - createBatchPayouts (callable)
# - processQueuedPayout (firestore trigger)

# View logs
firebase functions:log
```

### 11. Configure Cryptomus Webhook ✅

- [ ] Copy webhook URL from deployment output
- [ ] Go to Cryptomus Dashboard → Settings → Webhooks
- [ ] Add webhook URL: `https://us-central1-PROJECT_ID.cloudfunctions.net/cryptomusWebhook`
- [ ] Enable for: Payout status updates
- [ ] Test webhook from Cryptomus dashboard

## Post-Deployment

### 12. Integration Testing ✅

- [ ] Create test org wallet with small balance
- [ ] Create test payout via Admin UI
- [ ] Verify payout appears in Firestore
- [ ] Verify Cryptomus API call succeeds
- [ ] Simulate webhook callback
- [ ] Verify status updates correctly
- [ ] Check transaction logs
- [ ] Verify balance updates

### 13. Monitoring Setup ✅

```bash
# Set up log-based alerts
# Firebase Console → Functions → Logs
# Create alerts for:
# - Failed payouts (status=failed)
# - Webhook signature failures
# - Insufficient funds errors
# - Orphaned webhooks

# Set up Cloud Monitoring dashboards
# Track:
# - Function invocation count
# - Function execution time
# - Error rate
# - Payout success rate
```

### 14. Admin Dashboard ✅

- [ ] Deploy Next.js application
- [ ] Test Admin Payout Panel
- [ ] Verify wallet balance display
- [ ] Test single payout creation
- [ ] Test batch payout upload
- [ ] Test payout retry functionality

### 15. Hunter UI ✅

- [ ] Test PayoutStatus component
- [ ] Verify real-time status updates
- [ ] Test transaction link generation
- [ ] Check mobile responsiveness

## Production Checklist

### 16. Security Audit ✅

- [ ] Verify all API keys are in Functions config (not .env)
- [ ] Review Firestore security rules
- [ ] Test unauthorized access attempts
- [ ] Verify webhook signature validation
- [ ] Enable CORS restrictions
- [ ] Review audit log completeness

### 17. Performance ✅

- [ ] Test with high volume (100+ payouts)
- [ ] Monitor function cold start times
- [ ] Optimize Firestore queries
- [ ] Review transaction timeout settings
- [ ] Set up Cloud Tasks for batch processing

### 18. Documentation ✅

- [ ] Update team documentation
- [ ] Create runbook for common issues
- [ ] Document emergency procedures
- [ ] Train support team
- [ ] Create admin user guide

### 19. Compliance ✅

- [ ] Review data retention policies
- [ ] Ensure PII handling compliance
- [ ] Document audit trail
- [ ] Review cryptocurrency regulations
- [ ] Set up compliance reporting

## Go-Live

### 20. Production Deployment ✅

```bash
# Switch to production Cryptomus
firebase functions:config:set cryptomus.use_sandbox="false"

# Deploy to production
firebase deploy --only functions --project production

# Verify production webhook
# Update Cryptomus webhook URL to production endpoint
```

### 21. Monitoring (First 24 Hours) ✅

- [ ] Monitor Cloud Functions logs continuously
- [ ] Track payout success rate
- [ ] Watch for webhook failures
- [ ] Monitor wallet balances
- [ ] Check reconciliation reports
- [ ] Review error rates

### 22. Rollback Plan ✅

```bash
# If issues occur, rollback to previous version
firebase functions:delete createPayout
firebase functions:delete cryptomusWebhook
# ... delete other functions

# Redeploy previous version from git
git checkout PREVIOUS_TAG
firebase deploy --only functions
```

## Ongoing Maintenance

### 23. Daily Tasks ✅

- [ ] Review reconciliation reports
- [ ] Check for orphaned webhooks
- [ ] Monitor payout success rate
- [ ] Review failed payouts
- [ ] Check wallet balances

### 24. Weekly Tasks ✅

- [ ] Review audit logs
- [ ] Analyze payout trends
- [ ] Check function performance
- [ ] Review error patterns
- [ ] Update documentation

### 25. Monthly Tasks ✅

- [ ] Security review
- [ ] Update dependencies
- [ ] Review Cryptomus API changes
- [ ] Backup reconciliation reports
- [ ] Performance optimization review

## Emergency Procedures

### If Webhook Verification Fails ✅

```bash
# 1. Check Cryptomus API key configuration
firebase functions:config:get cryptomus

# 2. Review recent webhook payloads
# Query: payout_webhook_orphan collection

# 3. Test signature locally
cd functions && npm test

# 4. Contact Cryptomus support if needed
```

### If Payouts Fail ✅

```bash
# 1. Check function logs
firebase functions:log --only createPayout

# 2. Verify org wallet balance
# Check: org_wallets/{orgId}

# 3. Test Cryptomus API connectivity
# Use Postman collection

# 4. Retry failed payouts from Admin Panel
```

### If Balances Don't Match ✅

```bash
# 1. Run manual reconciliation
# Trigger: reconcilePayouts function manually

# 2. Review reconciliation report
# Check: payout_reconciliation_reports collection

# 3. Compare with Cryptomus dashboard
# Login to Cryptomus → Payouts → History

# 4. Create support ticket if discrepancies persist
```

## Support Contacts

- **Cryptomus Support**: support@cryptomus.com
- **Firebase Support**: https://firebase.google.com/support
- **Internal DevOps**: devops@bughuntr.com
- **On-Call Engineer**: oncall@bughuntr.com

## Version History

- **v1.0.0** (Dec 2025): Initial production deployment
  - Core payout functionality
  - Webhook integration
  - Daily reconciliation
  - Batch payouts
  - Admin dashboard
  - Hunter UI

---

**Deployment Status**: [ ] Not Started | [ ] In Progress | [ ] Completed  
**Last Updated**: December 8, 2025  
**Deployed By**: ********\_********  
**Deployment Date**: ********\_********
