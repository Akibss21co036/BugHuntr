# BugHuntr Crypto Payout System

Complete automated cryptocurrency payout system for BugHuntr platform using Cryptomus API, Firebase Cloud Functions, and Next.js.

## 🎯 Overview

This system automates crypto payouts to bug hunters when their submissions are approved by companies. Key features:

- ✅ **Automated Payouts**: Instant crypto transfers upon bug approval
- 🔒 **Secure**: Cryptomus signature verification, idempotency, audit logging
- 💰 **Wallet Management**: Track org balances, reserved funds, and available amounts
- 🔄 **Reconciliation**: Daily automated reconciliation with blockchain
- 📊 **Admin Dashboard**: Full UI for payout management
- 🚀 **Scalable**: Batch payouts, Cloud Tasks integration ready

## 📁 Project Structure

```
BugHuntr-4/
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts             # Main exports
│   │   ├── functions/           # Cloud Function implementations
│   │   │   ├── createPayout.ts
│   │   │   ├── cryptomusWebhook.ts
│   │   │   ├── reconcilePayouts.ts
│   │   │   └── createBatchPayouts.ts
│   │   ├── utils/               # Utility modules
│   │   │   ├── cryptomus-client.ts
│   │   │   ├── validation.ts
│   │   │   └── firestore.ts
│   │   └── __tests__/           # Unit tests
│   ├── package.json
│   └── tsconfig.json
├── types/
│   └── payout.ts                # TypeScript definitions
├── hooks/
│   └── use-payout.ts            # Client-side hook
├── components/payout/
│   ├── admin-payout-panel.tsx   # Admin UI
│   └── payout-status.tsx        # Hunter UI
└── docs/
    └── PAYOUT_SYSTEM_README.md  # This file
```

## 🔧 Setup & Configuration

### Prerequisites

- Node.js 18+ LTS
- Firebase CLI (`npm install -g firebase-tools`)
- Cryptomus merchant account
- Firebase project with Firestore and Cloud Functions enabled

### Step 1: Cryptomus Configuration

1. **Create Cryptomus Account**

   - Go to https://cryptomus.com
   - Register as a business/merchant
   - Complete KYC verification

2. **Get API Credentials**

   - Navigate to Settings > API Keys
   - Create new payout API key
   - Note down:
     - Merchant ID
     - Payout API Key

3. **Configure Webhook**
   - In Cryptomus dashboard: Settings > Webhooks
   - Add webhook URL: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/cryptomusWebhook`
   - Enable for: Payout status updates

### Step 2: Firebase Configuration

1. **Initialize Firebase** (if not already done)

   ```bash
   firebase login
   firebase init functions
   ```

2. **Set Cryptomus Secrets**

   ```bash
   cd functions
   firebase functions:config:set \
     cryptomus.merchant_id="YOUR_MERCHANT_ID" \
     cryptomus.payout_key="YOUR_PAYOUT_API_KEY" \
     cryptomus.use_sandbox="true"
   ```

   For production:

   ```bash
   firebase functions:config:set cryptomus.use_sandbox="false"
   ```

3. **Install Dependencies**

   ```bash
   cd functions
   npm install
   ```

4. **Build Functions**
   ```bash
   npm run build
   ```

### Step 3: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This deploys:

- `createPayout` - Callable function for creating payouts
- `cryptomusWebhook` - HTTP endpoint for webhooks
- `reconcilePayouts` - Scheduled daily reconciliation
- `createBatchPayouts` - Batch payout processing

### Step 4: Initialize Organization Wallets

Create a wallet document in Firestore for each organization:

```javascript
// Collection: org_wallets
// Document ID: {orgId}
{
  "orgId": "org_123",
  "currency": "USDC",
  "network": "POLYGON",
  "balance": 0,           // Will be updated when recording deposits
  "reserved": 0,
  "updatedAt": Timestamp.now()
}
```

### Step 5: Firestore Security Rules

Add to your `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Org wallets - admins only
    match /org_wallets/{orgId} {
      allow read: if request.auth != null &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin');
      allow write: if false; // Only Cloud Functions can write
    }

    // Payouts - hunters can read their own, admins can read org payouts
    match /payouts/{orderId} {
      allow read: if request.auth != null && (
        get(/databases/$(database)/documents/payouts/$(orderId)).data.hunterUid == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin'
      );
      allow write: if false; // Only Cloud Functions can write
    }

    // Logs - admins only
    match /payout_logs/{logId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin';
      allow write: if false;
    }

    // Orphaned webhooks - admins only
    match /payout_webhook_orphan/{id} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin';
      allow write: if false;
    }
  }
}
```

## 💻 Usage

### For Companies (Admin)

#### 1. Fund Your Wallet

Companies must deposit crypto to their Cryptomus-managed wallet **off-platform** first, then record the deposit in BugHuntr:

```typescript
// Admin panel: Record Top-Up button
// This updates Firestore only - actual deposit is external
```

#### 2. Create Single Payout

```typescript
import { usePayouts } from "@/hooks/use-payout";

const { createPayout } = usePayouts();

await createPayout({
  submissionId: "sub_abc123",
  huntId: "hunt_xyz789",
  orgId: "org_company1",
  hunterUid: "user_hunter1",
  hunterWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  amount: 1000000, // 1 USDC (in micro-units: 1,000,000 = 1.000000 USDC)
  currency: "USDC",
  network: "POLYGON",
});
```

#### 3. Batch Payouts (CSV Upload)

CSV format:

```csv
submissionId,huntId,hunterUid,hunterWallet,amount
sub_001,hunt_123,user_001,0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,1.500000
sub_002,hunt_123,user_002,0xAbCdEf1234567890AbCdEf1234567890AbCdEf12,2.250000
```

Upload via Admin Payout Panel → Batch Payouts tab

### For Hunters

Payouts are automatic upon approval. View status in submission details:

```tsx
import { PayoutStatus } from "@/components/payout/payout-status";

<PayoutStatus submissionId="sub_abc123" huntId="hunt_xyz789" />;
```

## 🔐 Security

### Idempotency

- Order IDs are deterministic: `BH-PAYOUT-{huntId}-{submissionId}`
- Duplicate calls return existing payout instead of creating new one
- Prevents accidental double payments

### Signature Verification

All webhooks are verified before processing:

```typescript
// TODO: Verify exact signing method with Cryptomus docs
// Current implementation: MD5(base64(jsonPayload) + apiKey)
// See: https://doc.cryptomus.com/business/authentication
```

### Atomic Transactions

All balance updates use Firestore transactions to prevent race conditions:

```typescript
// Reserve funds before creating payout
await reserveWalletFunds(orgId, amount);

// On success: deduct from balance
await completePayoutDeduction(orgId, amount);

// On failure: release reserved amount
await releaseReservedFunds(orgId, amount);
```

### Audit Trail

Every operation is logged to `payout_logs` collection:

```typescript
{
  "eventType": "create" | "update" | "webhook" | "reconcile",
  "order_id": "BH-PAYOUT-...",
  "actorUid": "user_admin1",
  "data": { /* full request/response */ },
  "timestamp": Timestamp
}
```

## 🧪 Testing

### Unit Tests

```bash
cd functions
npm test
```

Tests cover:

- ✅ Signature generation and verification
- ✅ Wallet address validation
- ✅ Amount formatting
- ✅ Firestore transaction logic
- ✅ Status mapping

### Integration Testing (Sandbox)

1. **Use Cryptomus Sandbox**

   ```bash
   firebase functions:config:set cryptomus.use_sandbox="true"
   firebase deploy --only functions
   ```

2. **Test Webhook Locally**

   ```bash
   # Terminal 1: Start emulator
   cd functions
   npm run serve

   # Terminal 2: Send test webhook
   curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/cryptomusWebhook \
     -H "Content-Type: application/json" \
     -d @test-webhook.json
   ```

3. **Sample Test Webhook** (`test-webhook.json`):
   ```json
   {
     "order_id": "BH-PAYOUT-test-123",
     "uuid": "test-uuid-456",
     "status": "paid",
     "txid": "0x1234567890abcdef",
     "amount": "1.000000",
     "currency": "USDC",
     "network": "POLYGON",
     "sign": "REPLACE_WITH_VALID_SIGNATURE"
   }
   ```

## 📊 Monitoring & Reconciliation

### Daily Reconciliation

Automated job runs daily at 2:00 AM UTC:

```typescript
// Compares Cryptomus payout history with Firestore
// Auto-fixes status mismatches
// Flags critical discrepancies for manual review
// Results stored in: payout_reconciliation_reports
```

### Cloud Logging

All operations log structured JSON:

```bash
# View logs
firebase functions:log

# Filter by function
firebase functions:log --only createPayout

# Stream logs
firebase functions:log --follow
```

### Metrics to Monitor

- **Payout Success Rate**: `completed / total`
- **Average Processing Time**: `updatedAt - createdAt`
- **Failed Payouts**: Count of status='failed'
- **Orphaned Webhooks**: Count in `payout_webhook_orphan`
- **Balance vs Reserved**: Should always be `balance >= reserved`

## 🚨 Error Handling

### Common Errors

| Error                           | Cause                      | Resolution                           |
| ------------------------------- | -------------------------- | ------------------------------------ |
| `INSUFFICIENT_FUNDS`            | Org balance too low        | Record wallet top-up                 |
| `WALLET_NOT_FOUND`              | Org wallet not initialized | Create wallet document               |
| `Invalid wallet address`        | Wrong address format       | Validate address format for network  |
| `Signature verification failed` | Invalid webhook            | Check Cryptomus API key config       |
| `Payout already exists`         | Duplicate call             | Idempotent - returns existing payout |

### Failed Payout Recovery

1. **Check Error** in payout document:

   ```javascript
   {
     "status": "failed",
     "error": {
       "code": "INSUFFICIENT_FUNDS",
       "message": "...",
       "details": { ... }
     }
   }
   ```

2. **Fix Root Cause** (e.g., top up wallet)

3. **Retry** via Admin Panel:
   - Click "Retry" button on failed payout
   - Creates new payout with `-retry` suffix

## 🎓 For Non-Blockchain Engineers

### Key Concepts Explained

**Wallet Address**: Like an email address for crypto. Format varies by blockchain (Ethereum/Polygon: `0x...`, Bitcoin: `1...` or `bc1...`).

**Network**: The blockchain where the transaction happens (Polygon, Ethereum, etc.). Different networks have different fees and speeds.

**USDC**: A stablecoin (always worth ~$1 USD). Most commonly used for payouts.

**Smallest Units**: Like cents to dollars. USDC has 6 decimals:

- 1 USDC = 1,000,000 micro-USDC
- In code: `amount: 1500000` = 1.5 USDC

**Transaction Hash (tx_hash)**: Unique ID for a blockchain transaction. Use it to look up the transaction on a block explorer (like Polygonscan.com).

**Gas Fees**: Small fees to process transactions. Paid by Cryptomus, not deducted from payout amount.

**Order ID**: Our unique identifier for each payout (`BH-PAYOUT-{huntId}-{submissionId}`). Prevents duplicate payments.

**Reserved Balance**: Amount temporarily locked for pending payouts. Ensures we don't overspend.

## 📞 Support & Troubleshooting

### Check Function Deployment

```bash
firebase functions:list
```

Expected output:

```
createPayout (https callable)
cryptomusWebhook (http request)
reconcilePayouts (pubsub scheduled)
createBatchPayouts (https callable)
```

### Test Webhook Signature Locally

```bash
cd functions
npm test -- cryptomus-client.test.ts
```

### View Orphaned Webhooks

Query Firestore:

```javascript
db.collection("payout_webhook_orphan")
  .orderBy("receivedAt", "desc")
  .limit(10)
  .get();
```

### Contact

- Cryptomus Support: https://cryptomus.com/support
- Firebase Support: https://firebase.google.com/support

## 📚 Additional Resources

- [Cryptomus API Documentation](https://doc.cryptomus.com)
- [Firebase Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Polygon Network Explorer](https://polygonscan.com)

## 🔄 Future Enhancements

- [ ] Automatic wallet top-up detection via blockchain monitoring
- [ ] Email/SMS notifications for payout events
- [ ] Multi-currency support (BTC, ETH, USDT)
- [ ] Advanced analytics dashboard
- [ ] Scheduled payouts (batch process at specific times)
- [ ] Support for other payment providers (Coinbase Commerce, etc.)

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**License**: Proprietary
