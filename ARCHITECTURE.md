# 🏗️ BugHuntr Crypto Payout System Architecture

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BugHuntr Platform                                │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                     ┌─────────────┼─────────────┐
                     │                           │
              ┌──────▼──────┐            ┌──────▼──────┐
              │   Company   │            │   Hunter    │
              │   Admin     │            │   (User)    │
              └──────┬──────┘            └──────┬──────┘
                     │                           │
                     │                           │
          ┌──────────▼──────────┐     ┌──────────▼──────────┐
          │ AdminPayoutPanel    │     │  PayoutStatus       │
          │ - View balances     │     │  - View status      │
          │ - Create payouts    │     │  - Track progress   │
          │ - Batch upload      │     │  - See TX hash      │
          │ - Retry failed      │     └─────────────────────┘
          └──────────┬──────────┘
                     │
                     │ usePayouts() hook
                     │
          ┌──────────▼──────────┐
          │  Firebase Functions │
          │   (Cloud Backend)   │
          └─────────┬───────────┘
                    │
       ┌────────────┼────────────┐
       │            │            │
   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
   │Create │   │Webhook│   │Recon- │
   │Payout │   │Handler│   │cile   │
   └───┬───┘   └───▲───┘   └───┬───┘
       │           │           │
       │      ┌────┘           │
       │      │                │
   ┌───▼──────▼────────────────▼───┐
   │        Firestore               │
   │  ┌──────────────────────┐     │
   │  │ org_wallets          │     │
   │  │ payouts              │     │
   │  │ payout_logs          │     │
   │  │ payout_webhook_orphan│     │
   │  └──────────────────────┘     │
   └────────┬───────────────────────┘
            │
            │
   ┌────────▼───────────┐
   │   Cryptomus API    │
   │  (Payment Gateway) │
   └────────┬───────────┘
            │
            │
   ┌────────▼───────────┐
   │   Blockchain       │
   │  (Polygon/Ethereum)│
   └────────────────────┘
```

## Data Flow Diagrams

### 1. Create Payout Flow

```
Admin UI                  Cloud Functions              Firestore           Cryptomus
   │                            │                          │                  │
   │ Create Payout Request      │                          │                  │
   ├───────────────────────────►│                          │                  │
   │                            │                          │                  │
   │                            │ Get Org Wallet           │                  │
   │                            ├─────────────────────────►│                  │
   │                            │◄─────────────────────────┤                  │
   │                            │  wallet data             │                  │
   │                            │                          │                  │
   │                            │ Reserve Funds (atomic)   │                  │
   │                            ├─────────────────────────►│                  │
   │                            │◄─────────────────────────┤                  │
   │                            │  reserved++              │                  │
   │                            │                          │                  │
   │                            │ Create Payout Doc        │                  │
   │                            ├─────────────────────────►│                  │
   │                            │  status: pending_created │                  │
   │                            │                          │                  │
   │                            │ Call Payout API          │                  │
   │                            ├──────────────────────────┼─────────────────►│
   │                            │                          │  {amount, address}│
   │                            │◄─────────────────────────┼──────────────────┤
   │                            │  {uuid, status}          │                  │
   │                            │                          │                  │
   │                            │ Update Payout            │                  │
   │                            ├─────────────────────────►│                  │
   │                            │  status: processing      │                  │
   │                            │  cryptomus_payout_id     │                  │
   │                            │                          │                  │
   │◄───────────────────────────┤                          │                  │
   │  {success, order_id}       │                          │                  │
   │                            │                          │                  │
```

### 2. Webhook Flow (Payment Completed)

```
Cryptomus             Cloud Functions            Firestore
   │                         │                       │
   │ POST /webhook           │                       │
   ├────────────────────────►│                       │
   │ {order_id, status:paid} │                       │
   │                         │                       │
   │                         │ Verify Signature      │
   │                         │ (MD5 hash check)      │
   │                         │                       │
   │                         │ Get Payout            │
   │                         ├──────────────────────►│
   │                         │◄──────────────────────┤
   │                         │  payout data          │
   │                         │                       │
   │                         │ Update Payout (atomic)│
   │                         ├──────────────────────►│
   │                         │  status: completed    │
   │                         │  tx_hash: 0xabc...    │
   │                         │  balance -= amount    │
   │                         │  reserved -= amount   │
   │                         │                       │
   │                         │ Create Log            │
   │                         ├──────────────────────►│
   │                         │                       │
   │◄────────────────────────┤                       │
   │  200 OK                 │                       │
   │                         │                       │
```

### 3. Reconciliation Flow (Daily)

```
Scheduler              Cloud Functions         Firestore          Cryptomus
   │                         │                      │                 │
   │ Trigger at 2:00 AM UTC  │                      │                 │
   ├────────────────────────►│                      │                 │
   │                         │                      │                 │
   │                         │ Get Cryptomus History│                 │
   │                         ├──────────────────────┼────────────────►│
   │                         │◄─────────────────────┼─────────────────┤
   │                         │  last 7 days payouts │                 │
   │                         │                      │                 │
   │                         │ Get Firestore Payouts│                 │
   │                         ├─────────────────────►│                 │
   │                         │◄─────────────────────┤                 │
   │                         │  last 7 days payouts │                 │
   │                         │                      │                 │
   │                         │ Compare & Identify   │                 │
   │                         │ Discrepancies        │                 │
   │                         │                      │                 │
   │                         │ Auto-Fix Mismatches  │                 │
   │                         ├─────────────────────►│                 │
   │                         │  update statuses     │                 │
   │                         │                      │                 │
   │                         │ Create Report        │                 │
   │                         ├─────────────────────►│                 │
   │                         │  payout_reconciliation│                │
   │                         │  _reports collection │                 │
   │                         │                      │                 │
```

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                          │
│                                                                 │
│  ┌─────────────────┐              ┌────────────────────┐       │
│  │ AdminPayoutPanel│              │   PayoutStatus     │       │
│  │                 │              │                    │       │
│  │ - Wallet display│              │ - Status display   │       │
│  │ - Payout form   │              │ - TX link          │       │
│  │ - Batch upload  │              │ - Real-time updates│       │
│  └────────┬────────┘              └─────────┬──────────┘       │
│           │                                 │                  │
│           └─────────┬───────────────────────┘                  │
│                     │                                          │
│              ┌──────▼──────┐                                   │
│              │ usePayouts()│                                   │
│              │  Custom Hook│                                   │
│              └──────┬──────┘                                   │
│                     │                                          │
└─────────────────────┼──────────────────────────────────────────┘
                      │ Firebase SDK
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                  Firebase Platform                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Cloud Functions (Backend)                    │   │
│  │                                                         │   │
│  │  ┌──────────┐  ┌───────────┐  ┌────────────┐          │   │
│  │  │ Create   │  │ Webhook   │  │ Reconcile  │          │   │
│  │  │ Payout   │  │ Handler   │  │ Payouts    │          │   │
│  │  └────┬─────┘  └─────┬─────┘  └──────┬─────┘          │   │
│  │       │              │                │                │   │
│  │       └──────────────┼────────────────┘                │   │
│  │                      │                                 │   │
│  │              ┌───────▼───────┐                         │   │
│  │              │   Utilities   │                         │   │
│  │              │ - Cryptomus   │                         │   │
│  │              │ - Validation  │                         │   │
│  │              │ - Firestore   │                         │   │
│  │              └───────┬───────┘                         │   │
│  └──────────────────────┼─────────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────▼─────────────────────────────────┐   │
│  │              Firestore Database                        │   │
│  │                                                        │   │
│  │  Collections:                                          │   │
│  │  • org_wallets       (organization balances)           │   │
│  │  • payouts           (payout records)                  │   │
│  │  • payout_logs       (audit trail)                     │   │
│  │  • payout_webhook_orphan (unmatched webhooks)          │   │
│  │  • batch_payout_jobs (batch processing)                │   │
│  │  • payout_reconciliation_reports (daily reports)       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Architecture                    │
└─────────────────────────────────────────────────────────────┘

Layer 1: Authentication
┌─────────────────────────────────────┐
│ Firebase Auth Token Verification    │
│ - All requests must be authenticated│
│ - Admin-only for payout creation    │
└─────────────────────────────────────┘
              │
              ▼
Layer 2: Authorization
┌─────────────────────────────────────┐
│ Firestore Security Rules            │
│ - Role-based access control         │
│ - Hunters see own payouts only      │
│ - Admins see org payouts only       │
│ - All writes: Cloud Functions only  │
└─────────────────────────────────────┘
              │
              ▼
Layer 3: Idempotency
┌─────────────────────────────────────┐
│ Order ID Deduplication              │
│ - BH-PAYOUT-{huntId}-{submissionId} │
│ - Prevents duplicate payments       │
│ - Returns existing payout if exists │
└─────────────────────────────────────┘
              │
              ▼
Layer 4: Webhook Verification
┌─────────────────────────────────────┐
│ Cryptomus Signature Verification    │
│ - MD5(base64(payload) + apiKey)     │
│ - Rejects invalid signatures (403)  │
│ - Stores orphans for investigation  │
└─────────────────────────────────────┘
              │
              ▼
Layer 5: Transaction Safety
┌─────────────────────────────────────┐
│ Atomic Firestore Transactions       │
│ - Reserve funds before API call     │
│ - Rollback on failure               │
│ - Balance consistency guaranteed    │
└─────────────────────────────────────┘
              │
              ▼
Layer 6: Audit Trail
┌─────────────────────────────────────┐
│ Comprehensive Logging                │
│ - All operations logged              │
│ - Actor, IP, timestamp tracked       │
│ - Full request/response stored       │
│ - Immutable append-only logs         │
└─────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling                           │
└─────────────────────────────────────────────────────────────┘

Payout Creation Error:
┌─────────────────────────────────────┐
│ Input Validation Fails              │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Return 400 error to client          │
│ No database changes made             │
└─────────────────────────────────────┘

Reserve Funds Error:
┌─────────────────────────────────────┐
│ Insufficient Funds                  │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Transaction rollback automatic      │
│ Return error with available balance │
│ Log to payout_logs                  │
└─────────────────────────────────────┘

Cryptomus API Error:
┌─────────────────────────────────────┐
│ API call fails                      │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Release reserved funds              │
│ Mark payout as failed               │
│ Store error in payout doc           │
│ Log full error details              │
│ Return error to client              │
└─────────────────────────────────────┘

Webhook Error:
┌─────────────────────────────────────┐
│ Invalid signature OR processing error│
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Store in payout_webhook_orphan      │
│ Log with reason                     │
│ Return 200/403 to Cryptomus         │
└─────────────────────────────────────┘
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────┐
│                  Monitoring Stack                           │
└─────────────────────────────────────────────────────────────┘

Cloud Logging (Stackdriver)
┌─────────────────────────────────────┐
│ Structured JSON Logs                │
│ - Function invocations              │
│ - Error traces                      │
│ - Performance metrics               │
│ - Custom events                     │
└──────────┬──────────────────────────┘
           │
           ▼
Firestore Collections
┌─────────────────────────────────────┐
│ Real-time Query Metrics             │
│ - Payout status distribution        │
│ - Failed payout count               │
│ - Orphaned webhook count            │
│ - Reconciliation results            │
└──────────┬──────────────────────────┘
           │
           ▼
Cloud Monitoring Dashboards
┌─────────────────────────────────────┐
│ Business Metrics                    │
│ - Success rate (%)                  │
│ - Average processing time           │
│ - Total volume processed            │
│ - Error rate trends                 │
└──────────┬──────────────────────────┘
           │
           ▼
Alerts & Notifications
┌─────────────────────────────────────┐
│ Threshold-based Alerts              │
│ - Failed payout spike               │
│ - Webhook signature failures        │
│ - Balance discrepancies             │
│ - Function errors                   │
└─────────────────────────────────────┘
```

---

## Technology Stack Summary

| Layer           | Technology                | Purpose                 |
| --------------- | ------------------------- | ----------------------- |
| **Frontend**    | Next.js 15 + React 19     | UI components           |
| **State**       | React Hooks               | Client state management |
| **Auth**        | Firebase Auth             | User authentication     |
| **Functions**   | Cloud Functions (Node 18) | Backend logic           |
| **Database**    | Firestore                 | NoSQL database          |
| **Payment**     | Cryptomus API             | Crypto payments         |
| **Blockchain**  | Polygon/Ethereum          | Transaction settlement  |
| **Language**    | TypeScript                | Type safety             |
| **Testing**     | Jest                      | Unit tests              |
| **API Testing** | Postman                   | Integration tests       |
| **Logging**     | Cloud Logging             | Observability           |
| **Monitoring**  | Cloud Monitoring          | Metrics & alerts        |
| **Scheduling**  | Cloud Scheduler           | Cron jobs               |

---

**Last Updated**: December 8, 2025  
**Version**: 1.0.0
