"use strict";
/**
 * Firestore Transaction Helpers
 *
 * Provides safe, atomic operations for wallet balance management.
 * These functions prevent race conditions when multiple payouts are processed simultaneously.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserveWalletFunds = reserveWalletFunds;
exports.releaseReservedFunds = releaseReservedFunds;
exports.completePayoutDeduction = completePayoutDeduction;
exports.recordWalletTopUp = recordWalletTopUp;
exports.createPayoutLog = createPayoutLog;
exports.storeOrphanedWebhook = storeOrphanedWebhook;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
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
async function reserveWalletFunds(orgId, amount) {
    const walletRef = db.collection('org_wallets').doc(orgId);
    try {
        const result = await db.runTransaction(async (transaction) => {
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists) {
                throw new Error('WALLET_NOT_FOUND');
            }
            const wallet = walletDoc.data();
            const balance = (wallet === null || wallet === void 0 ? void 0 : wallet.balance) || 0;
            const reserved = (wallet === null || wallet === void 0 ? void 0 : wallet.reserved) || 0;
            const available = balance - reserved;
            if (available < amount) {
                throw new Error(`INSUFFICIENT_FUNDS:${available}`);
            }
            // Atomically increment reserved amount
            transaction.update(walletRef, {
                reserved: admin.firestore.FieldValue.increment(amount),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { available, newReserved: reserved + amount };
        });
        functions.logger.info('Funds reserved successfully', {
            orgId,
            amount,
            previousAvailable: result.available,
            newReserved: result.newReserved
        });
        return { success: true, availableBalance: result.available };
    }
    catch (error) {
        if (error.message === 'WALLET_NOT_FOUND') {
            return { success: false, error: 'Organization wallet not found' };
        }
        if (error.message.startsWith('INSUFFICIENT_FUNDS')) {
            const available = parseFloat(error.message.split(':')[1]);
            return {
                success: false,
                error: `Insufficient funds. Available: ${available}, Required: ${amount}`,
                availableBalance: available
            };
        }
        functions.logger.error('Error reserving funds', { orgId, amount, error });
        return { success: false, error: 'Failed to reserve funds' };
    }
}
/**
 * Release reserved funds (when payout fails or is cancelled)
 *
 * @param orgId - Organization ID
 * @param amount - Amount to release
 */
async function releaseReservedFunds(orgId, amount) {
    const walletRef = db.collection('org_wallets').doc(orgId);
    try {
        await db.runTransaction(async (transaction) => {
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists) {
                throw new Error('Wallet not found');
            }
            // Atomically decrement reserved amount
            transaction.update(walletRef, {
                reserved: admin.firestore.FieldValue.increment(-amount),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        functions.logger.info('Reserved funds released', { orgId, amount });
    }
    catch (error) {
        functions.logger.error('Error releasing reserved funds', { orgId, amount, error });
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
async function completePayoutDeduction(orgId, amount) {
    const walletRef = db.collection('org_wallets').doc(orgId);
    try {
        await db.runTransaction(async (transaction) => {
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists) {
                throw new Error('Wallet not found');
            }
            // Atomically decrement both balance and reserved
            transaction.update(walletRef, {
                balance: admin.firestore.FieldValue.increment(-amount),
                reserved: admin.firestore.FieldValue.increment(-amount),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        functions.logger.info('Payout deduction completed', { orgId, amount });
    }
    catch (error) {
        functions.logger.error('Error completing payout deduction', { orgId, amount, error });
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
async function recordWalletTopUp(orgId, amount, metadata) {
    const walletRef = db.collection('org_wallets').doc(orgId);
    try {
        await db.runTransaction(async (transaction) => {
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists) {
                throw new Error('Wallet not found');
            }
            transaction.update(walletRef, {
                balance: admin.firestore.FieldValue.increment(amount),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastTopUpTx: {
                    amount,
                    txHash: metadata.txHash || null,
                    recordedBy: metadata.recordedBy,
                    recordedAt: admin.firestore.FieldValue.serverTimestamp(),
                    notes: metadata.notes || null
                }
            });
        });
        functions.logger.info('Wallet top-up recorded', { orgId, amount, metadata });
    }
    catch (error) {
        functions.logger.error('Error recording wallet top-up', { orgId, amount, error });
        throw error;
    }
}
/**
 * Create audit log entry
 *
 * @param logData - Log entry data
 */
async function createPayoutLog(logData) {
    try {
        await db.collection('payout_logs').add(Object.assign(Object.assign({}, logData), { timestamp: admin.firestore.FieldValue.serverTimestamp() }));
    }
    catch (error) {
        functions.logger.error('Error creating payout log', { logData, error });
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
async function storeOrphanedWebhook(payload, reason, signatureValid) {
    try {
        await db.collection('payout_webhook_orphan').add({
            payload,
            reason,
            signatureValid: signatureValid !== null && signatureValid !== void 0 ? signatureValid : null,
            receivedSignature: payload.sign || null,
            receivedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        functions.logger.warn('Orphaned webhook stored', { reason, order_id: payload.order_id });
    }
    catch (error) {
        functions.logger.error('Error storing orphaned webhook', { error });
    }
}
//# sourceMappingURL=firestore.js.map