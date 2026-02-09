/**
 * Firestore Transaction Helpers
 *
 * Provides safe, atomic operations for wallet balance management.
 * These functions prevent race conditions when multiple payouts are processed simultaneously.
 */

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

const db = admin.firestore();

/**
 * Atomically reserve funds from organization wallet
 *
 * This operation:
 * 1. Checks if wallet has sufficient balance
 * 2. Increments the 'reserved' field
 * 3. All or nothing - fails if balance insufficient
 *
 * @param orgId - Organization ID
 * @param amount - Amount to reserve (in smallest units)
 * @returns Success status and available balance
 */
export async function reserveWalletFunds(
  orgId: string,
  amount: number
): Promise<{ success: boolean; error?: string; availableBalance?: number }> {
  const walletRef = db.collection("org_wallets").doc(orgId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        throw new Error("WALLET_NOT_FOUND");
      }

      const wallet = walletDoc.data();
      const balance = wallet?.balance || 0;
      const reserved = wallet?.reserved || 0;
      const available = balance - reserved;

      if (available < amount) {
        throw new Error(`INSUFFICIENT_FUNDS:${available}`);
      }

      // Atomically increment reserved amount
      transaction.update(walletRef, {
        reserved: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { available, newReserved: reserved + amount };
    });

    functions.logger.info("Funds reserved successfully", {
      orgId,
      amount,
      previousAvailable: result.available,
      newReserved: result.newReserved,
    });

    return { success: true, availableBalance: result.available };
  } catch (error: any) {
    if (error.message === "WALLET_NOT_FOUND") {
      return { success: false, error: "Organization wallet not found" };
    }

    if (error.message.startsWith("INSUFFICIENT_FUNDS")) {
      const available = parseFloat(error.message.split(":")[1]);
      return {
        success: false,
        error: `Insufficient funds. Available: ${available}, Required: ${amount}`,
        availableBalance: available,
      };
    }

    functions.logger.error("Error reserving funds", { orgId, amount, error });
    return { success: false, error: "Failed to reserve funds" };
  }
}

/**
 * Release reserved funds (when payout fails or is cancelled)
 *
 * @param orgId - Organization ID
 * @param amount - Amount to release
 */
export async function releaseReservedFunds(
  orgId: string,
  amount: number
): Promise<void> {
  const walletRef = db.collection("org_wallets").doc(orgId);

  try {
    await db.runTransaction(async (transaction) => {
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        throw new Error("Wallet not found");
      }

      // Atomically decrement reserved amount
      transaction.update(walletRef, {
        reserved: admin.firestore.FieldValue.increment(-amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    functions.logger.info("Reserved funds released", { orgId, amount });
  } catch (error) {
    functions.logger.error("Error releasing reserved funds", {
      orgId,
      amount,
      error,
    });
    throw error;
  }
}

/**
 * Complete payout - deduct from balance and reserved
 *
 * Called when payout is confirmed successful on blockchain
 *
 * @param orgId - Organization ID
 * @param amount - Amount to deduct
 */
export async function completePayoutDeduction(
  orgId: string,
  amount: number
): Promise<void> {
  const walletRef = db.collection("org_wallets").doc(orgId);

  try {
    await db.runTransaction(async (transaction) => {
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        throw new Error("Wallet not found");
      }

      // Atomically decrement both balance and reserved
      transaction.update(walletRef, {
        balance: admin.firestore.FieldValue.increment(-amount),
        reserved: admin.firestore.FieldValue.increment(-amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    functions.logger.info("Payout deduction completed", { orgId, amount });
  } catch (error) {
    functions.logger.error("Error completing payout deduction", {
      orgId,
      amount,
      error,
    });
    throw error;
  }
}

/**
 * Record organization wallet top-up
 *
 * @param orgId - Organization ID
 * @param amount - Amount added
 * @param metadata - Top-up metadata
 */
export async function recordWalletTopUp(
  orgId: string,
  amount: number,
  metadata: {
    txHash?: string;
    recordedBy: string;
    notes?: string;
  }
): Promise<void> {
  const walletRef = db.collection("org_wallets").doc(orgId);

  try {
    await db.runTransaction(async (transaction) => {
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        throw new Error("Wallet not found");
      }

      transaction.update(walletRef, {
        balance: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastTopUpTx: {
          amount,
          txHash: metadata.txHash || null,
          recordedBy: metadata.recordedBy,
          recordedAt: admin.firestore.FieldValue.serverTimestamp(),
          notes: metadata.notes || null,
        },
      });
    });

    functions.logger.info("Wallet top-up recorded", {
      orgId,
      amount,
      metadata,
    });
  } catch (error) {
    functions.logger.error("Error recording wallet top-up", {
      orgId,
      amount,
      error,
    });
    throw error;
  }
}

/**
 * Create audit log entry
 *
 * @param logData - Log entry data
 */
export async function createPayoutLog(logData: {
  eventType: string;
  order_id?: string;
  actorUid?: string;
  ip?: string;
  userAgent?: string;
  data: any;
}): Promise<void> {
  try {
    await db.collection("payout_logs").add({
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    functions.logger.error("Error creating payout log", { logData, error });
    // Don't throw - logging failure shouldn't break main flow
  }
}

/**
 * Store orphaned webhook for investigation
 *
 * @param payload - Webhook payload
 * @param reason - Reason for orphan status
 * @param signatureValid - Whether signature was valid
 */
export async function storeOrphanedWebhook(
  payload: any,
  reason: string,
  signatureValid?: boolean
): Promise<void> {
  try {
    await db.collection("payout_webhook_orphan").add({
      payload,
      reason,
      signatureValid: signatureValid ?? null,
      receivedSignature: payload.sign || null,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.warn("Orphaned webhook stored", {
      reason,
      order_id: payload.order_id,
    });
  } catch (error) {
    functions.logger.error("Error storing orphaned webhook", { error });
  }
}
