/**
 * Cloud Function: Decide Reward & Payout Decision
 *
 * This internal function is called after CVSS triage approval.
 * It determines if a vulnerability qualifies for a payout based on the org's policy
 * and BugHuntr score. If it qualifies, it creates a payout record.
 *
 * Business Rules:
 * 1. If bughuntrScore < minScoreToPay => mark as 'rejected_low_severity'
 * 2. Otherwise, compute reward amount based on reward tier
 * 3. Create payout record with status 'awaiting_payment' or 'awaiting_manual_approval'
 *
 * Trigger: internal (called by approveCvss)
 *
 * TODO: This should be called from approveCvss after successful triage sign-off
 */

import * as admin from "firebase-admin";

const db = admin.firestore();

export async function decideRewardAndPayoutDecision(
  vulnId: string
): Promise<void> {
  try {
    // Load vulnerability
    const vulnDoc = await db.collection("vulnerabilities").doc(vulnId).get();
    if (!vulnDoc.exists) {
      console.warn(`Vulnerability ${vulnId} not found for reward decision`);
      return;
    }

    const vulnData = vulnDoc.data() || {};
    const bughuntrScore = vulnData.bughuntrScore?.approved || 0;
    const orgId = vulnData.orgId || "default";

    // Load org payout policy
    const orgDoc = await db.collection("orgs").doc(orgId).get();
    if (!orgDoc.exists) {
      console.warn(`Organization ${orgId} not found for payout policy`);
      return;
    }

    const orgData = orgDoc.data() || {};
    const payoutPolicy = orgData.payoutPolicy || {
      minScoreToPay: 4.0,
      rewardMultiplierTable: [
        { minScore: 9.0, maxScore: 10.0, multiplier: 2.0 },
        { minScore: 7.0, maxScore: 8.99, multiplier: 1.5 },
        { minScore: 4.0, maxScore: 6.99, multiplier: 1.0 },
        { minScore: 0.1, maxScore: 3.99, multiplier: 0.25 },
      ],
    };

    // Check auto-rejection threshold
    if (bughuntrScore < payoutPolicy.minScoreToPay) {
      // Auto-reject due to low severity
      await db
        .collection("vulnerabilities")
        .doc(vulnId)
        .update({
          status: "rejected_low_severity",
          rejectionReason: `BugHuntr score (${bughuntrScore}) below minimum payout threshold (${payoutPolicy.minScoreToPay})`,
          rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Write audit entry
      await db
        .collection("vulnerabilities")
        .doc(vulnId)
        .collection("audit")
        .add({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          actorUid: "system:auto-reject",
          action: "auto_rejected_low_severity",
          reason: `BugHuntr score ${bughuntrScore} < threshold ${payoutPolicy.minScoreToPay}`,
        });

      // TODO: Notify hunter that submission was rejected
      console.log(
        `Vulnerability ${vulnId} auto-rejected due to low severity (score: ${bughuntrScore})`
      );
      return;
    }

    // Find matching reward tier
    const rewardTable = payoutPolicy.rewardMultiplierTable || [];
    let multiplier = 1.0;
    let tierName = "MEDIUM";

    for (const tier of rewardTable) {
      if (bughuntrScore >= tier.minScore && bughuntrScore <= tier.maxScore) {
        multiplier = tier.multiplier || 1.0;
        tierName = tier.tierName || "MEDIUM";
        break;
      }
    }

    // Load hunt or submission to get base reward amount
    const submissionDoc = await db
      .collection("bug_submissions")
      .doc(vulnData.submissionId)
      .get();
    const submissionData = submissionDoc.data() || {};

    // Get base reward: from hunt, org config, or default
    const huntId = vulnData.huntId;
    let baseRewardCents = 10000; // Default: $100

    if (huntId) {
      const huntDoc = await db.collection("bug_hunts").doc(huntId).get();
      if (huntDoc.exists) {
        const huntData = huntDoc.data() || {};
        // Assume hunt has rewardAmount in cents
        baseRewardCents = huntData.rewardAmount || baseRewardCents;
      }
    }

    // Compute final reward
    const rewardCents = Math.round(baseRewardCents * multiplier);

    // Determine if auto-payout is enabled
    const autoPayoutEnabled = orgData.autoPayoutEnabled || false;

    // Create payout record
    // TODO: Integrate with existing payout system
    // This is a simplified example; coordinate with createPayout.ts
    const payoutId = `BH-PAYOUT-${vulnId}`;

    const payoutRecord = {
      payoutId,
      vulnId,
      submissionId: vulnData.submissionId,
      huntId: vulnData.huntId,
      orgId,
      hunterUid: submissionData.submitterUid,
      hunterWallet: submissionData.walletAddress || null,
      amount: rewardCents,
      currency: "USDC",
      network: "POLYGON",
      rewardTier: tierName,
      bughuntrScore,
      baseReward: baseRewardCents,
      multiplier,
      status: autoPayoutEnabled
        ? "awaiting_payment"
        : "awaiting_manual_approval",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: "system:auto-reward",
    };

    // Use transaction to update vulnerability and create payout
    await db.runTransaction(async (transaction) => {
      // Update vulnerability status
      transaction.update(db.collection("vulnerabilities").doc(vulnId), {
        status: "eligible_for_payout",
        payoutId,
        payoutStatus: autoPayoutEnabled ? "pending" : "manual_approval_pending",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create payout record
      transaction.set(db.collection("payouts").doc(payoutId), payoutRecord);
    });

    // Add audit entry
    await db.collection("vulnerabilities").doc(vulnId).collection("audit").add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      actorUid: "system:reward-decision",
      action: "reward_decided",
      bughuntrScore,
      rewardTier: tierName,
      rewardCents,
      multiplier,
      autoPayoutEnabled,
    });

    console.log(
      `Payout decided for ${vulnId}: ${tierName} tier, ${
        rewardCents / 100
      } USD (multiplier: ${multiplier}x)`
    );
  } catch (error) {
    console.error("Error deciding reward for", vulnId, error);
    throw error;
  }
}

/**
 * HTTP callable wrapper for manual trigger (admin only)
 */
import * as functions from "firebase-functions";

export const decideRewardAndPayoutDecisionCallable = functions
  .region("us-central1")
  .https.onCall(async (data: { vulnId: string }, context) => {
    // Auth check: admin only
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in"
      );
    }

    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    const userData = userDoc.data() || {};

    if (userData.role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Admin only");
    }

    try {
      await decideRewardAndPayoutDecision(data.vulnId);
      return { success: true, vulnId: data.vulnId };
    } catch (error) {
      console.error("Error in callable:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to decide reward"
      );
    }
  });
