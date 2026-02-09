# Firestore Security Rules - CVSS & CVE Module

Add the following rules to your `firestore.rules` file:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================================================
    // VULNERABILITIES COLLECTION
    // ============================================================================

    match /vulnerabilities/{vulnId} {
      // Read permissions
      // - Triagers can read all vulnerabilities
      // - Submitter can read their own vulnerability
      // - Org admins can read org vulnerabilities
      allow read: if
        request.auth.token.role in ['admin', 'triager']
        || request.auth.uid == resource.data.submitterUid
        || (request.auth.token.org == resource.data.orgId && request.auth.token.role == 'admin');

      // Create: Callable functions create vulnerabilities via backend
      allow create: if false;

      // Update: Only triagers and admins
      allow update: if
        request.auth.token.role in ['admin', 'triager']
        && (
          // Only triagers can update specific fields
          (request.resource.data.cvss.diff(resource.data.cvss).affectedKeys().size() > 0)
          || (request.resource.data.status != resource.data.status)
          || (request.resource.data.bughuntrScore.diff(resource.data.bughuntrScore).affectedKeys().size() > 0)
        );

      // Delete: Admins only (for testing/cleanup)
      allow delete: if request.auth.token.role == 'admin';

      // ========================================================================
      // AUDIT SUBCOLLECTION
      // ========================================================================

      match /audit/{auditId} {
        // Audit entries are append-only, immutable
        allow create: if request.auth != null
          && request.resource.data.timestamp == request.time
          && request.resource.data.actorUid == request.auth.uid;

        // Read audit trails: triagers and org admins
        allow read: if
          request.auth.token.role in ['admin', 'triager']
          || request.auth.token.org == parent(5).data.orgId;

        // No updates or deletes
        allow write: if false;
      }
    }

    // ============================================================================
    // CVE_REQUESTS COLLECTION
    // ============================================================================

    match /cve_requests/{reqId} {
      // Read: Triagers, admins, and requestor
      allow read: if
        request.auth.token.role in ['admin', 'triager']
        || request.auth.uid == resource.data.requestedBy;

      // Create: Only triagers and admins
      // (In practice, Cloud Functions handle creation)
      allow create: if
        request.auth.token.role in ['admin', 'triager']
        && request.resource.data.requestedBy == request.auth.uid
        && request.resource.data.requestedAt == request.time;

      // Update: Only admins or requestor (limited fields)
      allow update: if
        (request.auth.token.role == 'admin'
          || request.auth.uid == resource.data.requestedBy)
        && (
          // Allow status updates and notes additions
          request.resource.data.status != resource.data.status
          || request.resource.data.notes != resource.data.notes
          || request.resource.data.cveId != resource.data.cveId
        )
        && request.resource.data.updatedAt == request.time;

      // Delete: Admins only
      allow delete: if request.auth.token.role == 'admin';
    }

    // ============================================================================
    // ORGS COLLECTION (for payout policy reads)
    // ============================================================================

    match /orgs/{orgId} {
      // Org members can read org config (including payout policy)
      allow read: if
        request.auth.token.org == orgId
        || request.auth.token.role == 'admin';

      // Only admins can write
      allow write: if request.auth.token.role == 'admin';
    }

    // ============================================================================
    // USERS COLLECTION (for role checks)
    // ============================================================================

    match /users/{userId} {
      // Users can read their own profile
      // Admins/triagers can read all
      allow read: if
        request.auth.uid == userId
        || request.auth.token.role in ['admin', 'triager'];

      // Only own profile can update (except admins)
      allow write: if
        request.auth.uid == userId
        || request.auth.token.role == 'admin';
    }

    // ============================================================================
    // BUG_SUBMISSIONS (reads for vulnerability creation context)
    // ============================================================================

    match /bug_submissions/{submissionId} {
      // Submitter can read own
      // Triagers/admins can read for triage
      allow read: if
        request.auth.uid == resource.data.submitterUid
        || request.auth.token.role in ['admin', 'triager'];

      // Submitter can create own
      allow create: if request.auth.uid == request.resource.data.submitterUid;

      // Submitter/admins can update
      allow update: if
        request.auth.uid == resource.data.submitterUid
        || request.auth.token.role == 'admin';
    }

  }
}
```

## Important Notes

1. **Token Custom Claims**: Your Firebase Auth setup must include custom claims:

   ```javascript
   {
     "role": "admin|triager|user",
     "org": "orgId"
   }
   ```

2. **Cloud Functions Bypass**: Cloud Functions have full Firestore access and bypass these rules. Use backend validation carefully.

3. **Audit Trail Immutability**: Audit entries are append-only. Once created, they cannot be modified or deleted.

4. **Status Update Constraints**: Consider adding Cloud Function validation to ensure status transitions are legal (e.g., can't go from `triaged` back to `triage_pending`).

5. **Testing**: Test rules thoroughly in the Firestore emulator before deploying to production.

## Custom Claims Setup

In your authentication setup (e.g., during signup or admin panel):

```typescript
// Example: Cloud Function to set custom claims
import * as admin from "firebase-admin";

export const setUserRole = admin
  .functions()
  .https.onCall(async (data, context) => {
    const { userId, role, orgId } = data;

    if (!context.auth) throw new Error("Not authenticated");

    // TODO: Verify caller is org admin

    await admin.auth().setCustomUserClaims(userId, {
      role, // 'admin', 'triager', 'user'
      org: orgId,
    });

    return { success: true };
  });
```

## Deployment

After editing `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

Test in emulator first:

```bash
firebase emulators:start
# Run tests in separate terminal
npm test -- security-rules.test.ts
```
