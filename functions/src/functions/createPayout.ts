/**
 * Create Payout Cloud Function
 *
 * Callable function that creates a new crypto payout for an approved bug submission.
 *
 * Flow:
 * 1. Validate input and authenticate caller
 * 2. Check organization wallet has sufficient funds
 * 3. Reserve funds atomically
 * 4. Create payout record in Firestore
 * 5. Call Cryptomus API to initiate transfer
 * 6. Update payout status based on API response
 *
 * Idempotency: Uses order_id based on submissionId to prevent duplicate payouts
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { initializeCryptomusClient } from "../utils/cryptomus-client";
import {
  validateWalletAddress,
  validateAmount,
  formatAmountForCryptomus,
  generateOrderId,
} from "../utils/validation";
import {
  reserveWalletFunds,
  releaseReservedFunds,
  createPayoutLog,
} from "../utils/firestore";

const db = admin.firestore();

interface CreatePayoutData {
  submissionId: string;
  huntId: string;
  orgId: string;
  hunterUid: string;
  hunterWallet: string;
  amount: number;
  currency?: string;
  network?: string;
}

/**
 * Create a new payout
 *
 * Usage from Next.js:
 * ```typescript
 * const createPayout = httpsCallable(functions, 'createPayout');
 * const result = await createPayout({
 *   submissionId: 'sub_123',
 *   huntId: 'hunt_456',
 *   orgId: 'org_789',
 *   hunterUid: 'user_abc',
 *   hunterWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   amount: 1000000, // 1 USDC in micro-units
 *   currency: 'USDC',
 *   network: 'POLYGON'
 * });
 * ```
 */
export const createPayout = functions.https.onCall(
  async (data: CreatePayoutData, context) => {
    // ========================================================================
    // AUTHENTICATION & AUTHORIZATION
    // ========================================================================

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to create payouts"
      );
    }

    const callerUid = context.auth.uid;

    // Check if caller is admin (company admin or platform admin)
    const userDoc = await db.collection("users").doc(callerUid).get();
    const userData = userDoc.data();

    if (!userData || userData.userType !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only administrators can create payouts"
      );
    }

    functions.logger.info("Payout creation initiated", {
      callerUid,
      submissionId: data.submissionId,
      orgId: data.orgId,
      amount: data.amount,
    });

    // ========================================================================
    // INPUT VALIDATION
    // ========================================================================

    if (
      !data.submissionId ||
      !data.huntId ||
      !data.orgId ||
      !data.hunterUid ||
      !data.hunterWallet ||
      !data.amount
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: submissionId, huntId, orgId, hunterUid, hunterWallet, amount"
      );
    }

    // Validate amount
    const amountValidation = validateAmount(
      data.amount,
      data.currency || "USDC"
    );
    if (!amountValidation.isValid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid amount: ${amountValidation.error}`
      );
    }

    // ========================================================================
    // IDEMPOTENCY CHECK
    // ========================================================================

    const order_id = generateOrderId(data.submissionId, data.huntId);
    const existingPayoutDoc = await db
      .collection("payouts")
      .doc(order_id)
      .get();

    if (existingPayoutDoc.exists) {
      const existingPayout = existingPayoutDoc.data();

      functions.logger.info("Payout already exists (idempotency)", {
        order_id,
        status: existingPayout?.status,
      });

      // Return existing payout instead of creating duplicate
      return {
        success: true,
        order_id,
        status: existingPayout?.status,
        cryptomus_payout_id: existingPayout?.cryptomus_payout_id,
        message: "Payout already exists for this submission",
        isExisting: true,
      };
    }

    // ========================================================================
    // GET ORGANIZATION WALLET
    // ========================================================================

    const walletDoc = await db.collection("org_wallets").doc(data.orgId).get();

    if (!walletDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `Organization wallet not found for orgId: ${data.orgId}`
      );
    }

    const wallet = walletDoc.data();
    const currency = data.currency || wallet?.currency || "USDC";
    const network = data.network || wallet?.network || "POLYGON";

    // Validate wallet address for the network
    const walletValidation = validateWalletAddress(data.hunterWallet, network);
    if (!walletValidation.isValid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid wallet address: ${walletValidation.error}`
      );
    }

    // ========================================================================
    // RESERVE FUNDS
    // ========================================================================

    const reserveResult = await reserveWalletFunds(data.orgId, data.amount);

    if (!reserveResult.success) {
      await createPayoutLog({
        eventType: "create",
        order_id,
        actorUid: callerUid,
        data: {
          error: reserveResult.error,
          request: data,
          availableBalance: reserveResult.availableBalance,
        },
      });

      throw new functions.https.HttpsError(
        "failed-precondition",
        reserveResult.error || "Failed to reserve funds"
      );
    }

    // ========================================================================
    // CREATE PAYOUT RECORD
    // ========================================================================

    const payoutData = {
      order_id,
      huntId: data.huntId,
      submissionId: data.submissionId,
      orgId: data.orgId,
      hunterUid: data.hunterUid,
      hunterWallet: data.hunterWallet,
      amount: data.amount,
      currency,
      network,
      status: "pending_created",
      createdBy: callerUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("payouts").doc(order_id).set(payoutData);

    functions.logger.info("Payout record created", { order_id });

    // ========================================================================
    // CALL CRYPTOMUS API
    // ========================================================================

    try {
      const cryptomusClient = initializeCryptomusClient();

      // Get webhook callback URL from config
      const webhookUrl =
        functions.config().cryptomus?.webhook_url ||
        `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/cryptomusWebhook`;

      const cryptomusResponse = await cryptomusClient.createPayout({
        amount: formatAmountForCryptomus(data.amount, currency),
        currency,
        address: data.hunterWallet,
        order_id,
        network,
        url_callback: webhookUrl,
      });

      // ========================================================================
      // UPDATE PAYOUT WITH CRYPTOMUS RESPONSE
      // ========================================================================

      await db
        .collection("payouts")
        .doc(order_id)
        .update({
          status: "processing",
          cryptomus_payout_id: cryptomusResponse.result?.uuid || null,
          cryptomus_response: cryptomusResponse,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      await createPayoutLog({
        eventType: "create",
        order_id,
        actorUid: callerUid,
        data: {
          request: data,
          response: cryptomusResponse,
          newStatus: "processing",
        },
      });

      functions.logger.info("Payout created successfully", {
        order_id,
        cryptomus_payout_id: cryptomusResponse.result?.uuid,
      });

      return {
        success: true,
        order_id,
        status: "processing",
        cryptomus_payout_id: cryptomusResponse.result?.uuid,
        message: "Payout initiated successfully",
      };
    } catch (error: any) {
      // ========================================================================
      // ERROR HANDLING - RELEASE RESERVED FUNDS
      // ========================================================================

      functions.logger.error("Cryptomus API error", {
        order_id,
        error: error.message,
        details: error.details,
      });

      // Release reserved funds since payout failed
      await releaseReservedFunds(data.orgId, data.amount);

      // Update payout status to failed
      await db
        .collection("payouts")
        .doc(order_id)
        .update({
          status: "failed",
          error: {
            code: error.code || "CRYPTOMUS_ERROR",
            message: error.message,
            details: error.details,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      await createPayoutLog({
        eventType: "create",
        order_id,
        actorUid: callerUid,
        data: {
          request: data,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          newStatus: "failed",
        },
      });

      throw new functions.https.HttpsError(
        "internal",
        `Failed to create payout: ${error.message}`,
        error.details
      );
    }
  }
);
