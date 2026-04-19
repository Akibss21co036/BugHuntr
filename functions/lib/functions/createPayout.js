"use strict";
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
exports.createPayout = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cryptomus_client_1 = require("../utils/cryptomus-client");
const validation_1 = require("../utils/validation");
const firestore_1 = require("../utils/firestore");
const db = admin.firestore();
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
exports.createPayout = functions.https.onCall(async (data, context) => {
    // ========================================================================
    // AUTHENTICATION & AUTHORIZATION
    // ========================================================================
    var _a, _b, _c, _d;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to create payouts');
    }
    const callerUid = context.auth.uid;
    // Check if caller is admin (company admin or platform admin)
    const userDoc = await db.collection('users').doc(callerUid).get();
    const userData = userDoc.data();
    if (!userData || userData.userType !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only administrators can create payouts');
    }
    functions.logger.info('Payout creation initiated', {
        callerUid,
        submissionId: data.submissionId,
        orgId: data.orgId,
        amount: data.amount
    });
    // ========================================================================
    // INPUT VALIDATION
    // ========================================================================
    if (!data.submissionId || !data.huntId || !data.orgId || !data.hunterUid || !data.hunterWallet || !data.amount) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: submissionId, huntId, orgId, hunterUid, hunterWallet, amount');
    }
    // Validate amount
    const amountValidation = (0, validation_1.validateAmount)(data.amount, data.currency || 'USDC');
    if (!amountValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid amount: ${amountValidation.error}`);
    }
    // ========================================================================
    // IDEMPOTENCY CHECK
    // ========================================================================
    const order_id = (0, validation_1.generateOrderId)(data.submissionId, data.huntId);
    const existingPayoutDoc = await db.collection('payouts').doc(order_id).get();
    if (existingPayoutDoc.exists) {
        const existingPayout = existingPayoutDoc.data();
        functions.logger.info('Payout already exists (idempotency)', {
            order_id,
            status: existingPayout === null || existingPayout === void 0 ? void 0 : existingPayout.status
        });
        // Return existing payout instead of creating duplicate
        return {
            success: true,
            order_id,
            status: existingPayout === null || existingPayout === void 0 ? void 0 : existingPayout.status,
            cryptomus_payout_id: existingPayout === null || existingPayout === void 0 ? void 0 : existingPayout.cryptomus_payout_id,
            message: 'Payout already exists for this submission',
            isExisting: true
        };
    }
    // ========================================================================
    // GET ORGANIZATION WALLET
    // ========================================================================
    const walletDoc = await db.collection('org_wallets').doc(data.orgId).get();
    if (!walletDoc.exists) {
        throw new functions.https.HttpsError('not-found', `Organization wallet not found for orgId: ${data.orgId}`);
    }
    const wallet = walletDoc.data();
    const currency = data.currency || (wallet === null || wallet === void 0 ? void 0 : wallet.currency) || 'USDC';
    const network = data.network || (wallet === null || wallet === void 0 ? void 0 : wallet.network) || 'POLYGON';
    // Validate wallet address for the network
    const walletValidation = (0, validation_1.validateWalletAddress)(data.hunterWallet, network);
    if (!walletValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid wallet address: ${walletValidation.error}`);
    }
    // ========================================================================
    // RESERVE FUNDS
    // ========================================================================
    const reserveResult = await (0, firestore_1.reserveWalletFunds)(data.orgId, data.amount);
    if (!reserveResult.success) {
        await (0, firestore_1.createPayoutLog)({
            eventType: 'create',
            order_id,
            actorUid: callerUid,
            data: {
                error: reserveResult.error,
                request: data,
                availableBalance: reserveResult.availableBalance
            }
        });
        throw new functions.https.HttpsError('failed-precondition', reserveResult.error || 'Failed to reserve funds');
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
        status: 'pending_created',
        createdBy: callerUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('payouts').doc(order_id).set(payoutData);
    functions.logger.info('Payout record created', { order_id });
    // ========================================================================
    // CALL CRYPTOMUS API
    // ========================================================================
    try {
        const cryptomusClient = (0, cryptomus_client_1.initializeCryptomusClient)();
        // Get webhook callback URL from config
        const webhookUrl = ((_a = functions.config().cryptomus) === null || _a === void 0 ? void 0 : _a.webhook_url) ||
            `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/cryptomusWebhook`;
        const cryptomusResponse = await cryptomusClient.createPayout({
            amount: (0, validation_1.formatAmountForCryptomus)(data.amount, currency),
            currency,
            address: data.hunterWallet,
            order_id,
            network,
            url_callback: webhookUrl
        });
        // ========================================================================
        // UPDATE PAYOUT WITH CRYPTOMUS RESPONSE
        // ========================================================================
        await db.collection('payouts').doc(order_id).update({
            status: 'processing',
            cryptomus_payout_id: ((_b = cryptomusResponse.result) === null || _b === void 0 ? void 0 : _b.uuid) || null,
            cryptomus_response: cryptomusResponse,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await (0, firestore_1.createPayoutLog)({
            eventType: 'create',
            order_id,
            actorUid: callerUid,
            data: {
                request: data,
                response: cryptomusResponse,
                newStatus: 'processing'
            }
        });
        functions.logger.info('Payout created successfully', {
            order_id,
            cryptomus_payout_id: (_c = cryptomusResponse.result) === null || _c === void 0 ? void 0 : _c.uuid
        });
        return {
            success: true,
            order_id,
            status: 'processing',
            cryptomus_payout_id: (_d = cryptomusResponse.result) === null || _d === void 0 ? void 0 : _d.uuid,
            message: 'Payout initiated successfully'
        };
    }
    catch (error) {
        // ========================================================================
        // ERROR HANDLING - RELEASE RESERVED FUNDS
        // ========================================================================
        functions.logger.error('Cryptomus API error', {
            order_id,
            error: error.message,
            details: error.details
        });
        // Release reserved funds since payout failed
        await (0, firestore_1.releaseReservedFunds)(data.orgId, data.amount);
        // Update payout status to failed
        await db.collection('payouts').doc(order_id).update({
            status: 'failed',
            error: {
                code: error.code || 'CRYPTOMUS_ERROR',
                message: error.message,
                details: error.details
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await (0, firestore_1.createPayoutLog)({
            eventType: 'create',
            order_id,
            actorUid: callerUid,
            data: {
                request: data,
                error: {
                    code: error.code,
                    message: error.message,
                    details: error.details
                },
                newStatus: 'failed'
            }
        });
        throw new functions.https.HttpsError('internal', `Failed to create payout: ${error.message}`, error.details);
    }
});
//# sourceMappingURL=createPayout.js.map