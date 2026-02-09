/**
 * Reconcile Payouts Scheduled Function
 *
 * Runs daily to reconcile Cryptomus payout history with Firestore records.
 * Identifies discrepancies for manual review.
 *
 * Schedule: Every day at 2:00 AM UTC
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { initializeCryptomusClient } from "../utils/cryptomus-client";
import { mapCryptomusStatus } from "../utils/validation";
import { createPayoutLog } from "../utils/firestore";

const db = admin.firestore();

/**
 * Scheduled reconciliation function
 *
 * Deploy: firebase deploy --only functions:reconcilePayouts
 */
export const reconcilePayouts = functions.pubsub
  .schedule("0 2 * * *") // Every day at 2:00 AM UTC
  .timeZone("UTC")
  .onRun(async (context) => {
    functions.logger.info("Starting payout reconciliation");

    try {
      const cryptomusClient = initializeCryptomusClient();

      // Get last 7 days of payouts from Cryptomus
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateFrom = sevenDaysAgo.toISOString().split("T")[0];

      const cryptomusHistory = await cryptomusClient.getPayoutHistory({
        date_from: dateFrom,
        limit: 1000,
      });

      const cryptomusPayouts = cryptomusHistory.result?.items || [];

      functions.logger.info("Fetched Cryptomus history", {
        count: cryptomusPayouts.length,
        dateFrom,
      });

      // Get Firestore payouts from last 7 days
      const firestoreSnapshot = await db
        .collection("payouts")
        .where("createdAt", ">=", sevenDaysAgo)
        .get();

      const firestorePayouts = new Map();
      firestoreSnapshot.forEach((doc) => {
        firestorePayouts.set(doc.id, doc.data());
      });

      functions.logger.info("Fetched Firestore payouts", {
        count: firestorePayouts.size,
      });

      // ====================================================================
      // RECONCILIATION LOGIC
      // ====================================================================

      const discrepancies = {
        missingInFirestore: [] as string[],
        missingInCryptomus: [] as string[],
        statusMismatches: [] as any[],
        resolved: [] as string[],
      };

      // Check Cryptomus payouts against Firestore
      for (const cryptomusPayout of cryptomusPayouts) {
        const order_id = cryptomusPayout.order_id;
        const firestorePayout = firestorePayouts.get(order_id);

        if (!firestorePayout) {
          // Payout exists in Cryptomus but not in Firestore
          discrepancies.missingInFirestore.push(order_id);

          functions.logger.warn("Payout missing in Firestore", {
            order_id,
            cryptomusStatus: cryptomusPayout.status,
            cryptomusUuid: cryptomusPayout.uuid,
          });
        } else {
          // Compare statuses
          const cryptomusInternalStatus = mapCryptomusStatus(
            cryptomusPayout.status
          );
          const firestoreStatus = firestorePayout.status;

          if (cryptomusInternalStatus !== firestoreStatus) {
            discrepancies.statusMismatches.push({
              order_id,
              firestoreStatus,
              cryptomusStatus: cryptomusPayout.status,
              cryptomusInternalStatus,
            });

            functions.logger.warn("Status mismatch detected", {
              order_id,
              firestoreStatus,
              cryptomusStatus: cryptomusPayout.status,
              expectedStatus: cryptomusInternalStatus,
            });

            // Auto-fix status mismatches
            try {
              await db
                .collection("payouts")
                .doc(order_id)
                .update({
                  status: cryptomusInternalStatus,
                  cryptomus_response: {
                    ...firestorePayout.cryptomus_response,
                    reconciliationUpdate: {
                      previousStatus: firestoreStatus,
                      newStatus: cryptomusInternalStatus,
                      reconciledAt:
                        admin.firestore.FieldValue.serverTimestamp(),
                      cryptomusData: cryptomusPayout,
                    },
                  },
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

              if (cryptomusPayout.txid && !firestorePayout.tx_hash) {
                await db.collection("payouts").doc(order_id).update({
                  tx_hash: cryptomusPayout.txid,
                });
              }

              discrepancies.resolved.push(order_id);

              functions.logger.info("Status mismatch auto-resolved", {
                order_id,
                from: firestoreStatus,
                to: cryptomusInternalStatus,
              });
            } catch (error: any) {
              functions.logger.error("Failed to auto-resolve mismatch", {
                order_id,
                error: error.message,
              });
            }
          }

          // Remove from map (for detecting missing in Cryptomus)
          firestorePayouts.delete(order_id);
        }
      }

      // Remaining payouts in Firestore map are missing in Cryptomus
      firestorePayouts.forEach((payout, order_id) => {
        // Only flag if status is not pending_created (might not be submitted yet)
        if (payout.status !== "pending_created") {
          discrepancies.missingInCryptomus.push(order_id);

          functions.logger.warn("Payout missing in Cryptomus", {
            order_id,
            firestoreStatus: payout.status,
            cryptomusPayoutId: payout.cryptomus_payout_id,
          });
        }
      });

      // ====================================================================
      // SAVE RECONCILIATION REPORT
      // ====================================================================

      const report = {
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        dateRange: {
          from: dateFrom,
          to: new Date().toISOString().split("T")[0],
        },
        totals: {
          cryptomusPayouts: cryptomusPayouts.length,
          firestorePayouts: firestoreSnapshot.size,
          missingInFirestore: discrepancies.missingInFirestore.length,
          missingInCryptomus: discrepancies.missingInCryptomus.length,
          statusMismatches: discrepancies.statusMismatches.length,
          autoResolved: discrepancies.resolved.length,
        },
        discrepancies,
      };

      await db.collection("payout_reconciliation_reports").add(report);

      await createPayoutLog({
        eventType: "reconcile",
        data: {
          summary: report.totals,
          hasDiscrepancies:
            discrepancies.missingInFirestore.length > 0 ||
            discrepancies.missingInCryptomus.length > 0 ||
            discrepancies.statusMismatches.length > 0,
        },
      });

      functions.logger.info("Reconciliation completed", {
        totals: report.totals,
      });

      // Alert admin if critical discrepancies found
      if (
        discrepancies.missingInFirestore.length > 0 ||
        discrepancies.missingInCryptomus.length > 5
      ) {
        functions.logger.error("CRITICAL: Significant discrepancies found", {
          missingInFirestore: discrepancies.missingInFirestore.length,
          missingInCryptomus: discrepancies.missingInCryptomus.length,
        });
        // TODO: Send email/slack notification to admin
      }
    } catch (error: any) {
      functions.logger.error("Reconciliation failed", {
        error: error.message,
        stack: error.stack,
      });

      await createPayoutLog({
        eventType: "reconcile",
        data: {
          error: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  });
