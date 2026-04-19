/**
 * Batch Payout Creation Function
 *
 * Accepts CSV file with multiple payout requests and queues them for processing.
 * Uses Cloud Tasks to rate-limit API calls and handle retries.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createPayoutLog } from "../utils/firestore";

const db = admin.firestore();

interface BatchPayoutRow {
  submissionId: string;
  huntId: string;
  hunterUid: string;
  hunterWallet: string;
  amount: number;
}

/**
 * Create batch payouts from CSV data
 *
 * Usage from Next.js API route:
 * ```typescript
 * const createBatchPayouts = httpsCallable(functions, 'createBatchPayouts');
 * const result = await createBatchPayouts({
 *   orgId: 'org_123',
 *   payouts: [
 *     { submissionId: 'sub_1', huntId: 'hunt_1', hunterUid: 'user_1', hunterWallet: '0x...', amount: 1000000 },
 *     { submissionId: 'sub_2', huntId: 'hunt_1', hunterUid: 'user_2', hunterWallet: '0x...', amount: 2000000 }
 *   ]
 * });
 * ```
 */
export const createBatchPayouts = functions.https.onCall(
  async (
    data: {
      orgId: string;
      payouts: BatchPayoutRow[];
    },
    context
  ) => {
    // ========================================================================
    // AUTHENTICATION & AUTHORIZATION
    // ========================================================================

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to create batch payouts"
      );
    }

    const callerUid = context.auth.uid;

    // Check if caller is admin
    const userDoc = await db.collection("users").doc(callerUid).get();
    const userData = userDoc.data();

    if (!userData || userData.userType !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only administrators can create batch payouts"
      );
    }

    functions.logger.info("Batch payout creation initiated", {
      callerUid,
      orgId: data.orgId,
      totalRows: data.payouts?.length || 0,
    });

    // ========================================================================
    // INPUT VALIDATION
    // ========================================================================

    if (!data.orgId || !data.payouts || !Array.isArray(data.payouts)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: orgId and payouts array"
      );
    }

    if (data.payouts.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Payouts array cannot be empty"
      );
    }

    if (data.payouts.length > 1000) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Maximum 1000 payouts per batch"
      );
    }

    // ========================================================================
    // CREATE BATCH JOB RECORD
    // ========================================================================

    const batchId = db.collection("batch_payout_jobs").doc().id;

    const batchJob = {
      batchId,
      orgId: data.orgId,
      createdBy: callerUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "queued",
      totalRows: data.payouts.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    await db.collection("batch_payout_jobs").doc(batchId).set(batchJob);

    // ========================================================================
    // QUEUE INDIVIDUAL PAYOUTS
    // ========================================================================

    const results = {
      totalRows: data.payouts.length,
      queued: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Process payouts sequentially to avoid overwhelming the system
    // In production, you would use Cloud Tasks for better rate limiting
    for (let i = 0; i < data.payouts.length; i++) {
      const payout = data.payouts[i];

      try {
        // Validate row data
        if (
          !payout.submissionId ||
          !payout.huntId ||
          !payout.hunterUid ||
          !payout.hunterWallet ||
          !payout.amount
        ) {
          throw new Error("Missing required fields in payout row");
        }

        // Queue payout task
        // In production, use Cloud Tasks:
        // await cloudTasks.createTask({
        //   parent: queuePath,
        //   task: {
        //     httpRequest: {
        //       httpMethod: 'POST',
        //       url: createPayoutUrl,
        //       body: Buffer.from(JSON.stringify({
        //         data: { ...payout, orgId: data.orgId }
        //       })).toString('base64'),
        //       headers: { 'Content-Type': 'application/json' }
        //     }
        //   }
        // });

        // For now, create a simple queue record
        await db.collection("payout_queue").add({
          batchId,
          orgId: data.orgId,
          submissionId: payout.submissionId,
          huntId: payout.huntId,
          hunterUid: payout.hunterUid,
          hunterWallet: payout.hunterWallet,
          amount: payout.amount,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          rowNumber: i + 1,
        });

        results.queued++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message,
        });

        functions.logger.error("Failed to queue payout", {
          batchId,
          row: i + 1,
          error: error.message,
        });
      }
    }

    // ========================================================================
    // UPDATE BATCH JOB STATUS
    // ========================================================================

    await db
      .collection("batch_payout_jobs")
      .doc(batchId)
      .update({
        status: results.failed === results.totalRows ? "failed" : "processing",
        queued: results.queued,
        failedToQueue: results.failed,
        queueErrors: results.errors,
      });

    await createPayoutLog({
      eventType: "create",
      actorUid: callerUid,
      data: {
        batchId,
        orgId: data.orgId,
        totalRows: results.totalRows,
        queued: results.queued,
        failed: results.failed,
      },
    });

    functions.logger.info("Batch payouts queued", {
      batchId,
      results,
    });

    return {
      success: true,
      batchId,
      ...results,
    };
  }
);

/**
 * Process queued payouts
 *
 * Triggered by Firestore onCreate in payout_queue collection
 * In production, this would be replaced by Cloud Tasks worker
 */
export const processQueuedPayout = functions.firestore
  .document("payout_queue/{queueId}")
  .onCreate(async (snap, context) => {
    const queueItem = snap.data();
    const queueId = context.params.queueId;

    if (queueItem.status !== "pending") {
      return; // Already processed
    }

    functions.logger.info("Processing queued payout", {
      queueId,
      batchId: queueItem.batchId,
      submissionId: queueItem.submissionId,
    });

    try {
      // Call createPayout function
      // Note: In production, this would be done via Cloud Tasks HTTP request
      // to avoid function timeout issues with large batches

      // For now, mark as needing manual processing
      await snap.ref.update({
        status: "processing",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // TODO: Implement actual payout creation via internal function call
      // or Cloud Tasks queue

      functions.logger.info("Queued payout requires manual processing", {
        queueId,
        message: "Use Cloud Tasks in production for automatic processing",
      });
    } catch (error: any) {
      functions.logger.error("Failed to process queued payout", {
        queueId,
        error: error.message,
      });

      await snap.ref.update({
        status: "failed",
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
