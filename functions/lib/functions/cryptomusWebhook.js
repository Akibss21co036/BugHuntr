"use strict";
/**
 * Cryptomus Webhook Handler
 *
 * Receives webhook notifications from Cryptomus when payout status changes.
 *
 * Security:
 * - Verifies webhook signature before processing
 * - Stores unverified webhooks as orphans
 *
 * Flow:
 * 1. Verify webhook signature
 * 2. Extract order_id and status
 * 3. Update payout record in Firestore
 * 4. If completed: deduct from org wallet balance
 * 5. If failed: release reserved funds
 * 6. Log all webhook events
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
exports.cryptomusWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cryptomus_client_1 = require("../utils/cryptomus-client");
const validation_1 = require("../utils/validation");
const firestore_1 = require("../utils/firestore");
const db = admin.firestore();
/**
 * Cryptomus Webhook Endpoint
 *
 * POST endpoint: https://us-central1-PROJECT_ID.cloudfunctions.net/cryptomusWebhook
 *
 * Configure this URL in Cryptomus merchant dashboard
 */
exports.cryptomusWebhook = functions.https.onRequest(async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const payload = req.body;
    functions.logger.info('Webhook received', {
        order_id: payload.order_id,
        status: payload.status,
        uuid: payload.uuid
    });
    // ========================================================================
    // SIGNATURE VERIFICATION
    // ========================================================================
    try {
        const cryptomusClient = (0, cryptomus_client_1.initializeCryptomusClient)();
        const receivedSignature = payload.sign || req.headers['sign'];
        if (!receivedSignature) {
            functions.logger.warn('Webhook missing signature', { payload });
            await (0, firestore_1.storeOrphanedWebhook)(payload, 'Missing signature', false);
            res.status(403).send('Missing signature');
            return;
        }
        const isValidSignature = cryptomusClient.verifyWebhookSignature(payload, receivedSignature);
        if (!isValidSignature) {
            functions.logger.error('Invalid webhook signature', {
                order_id: payload.order_id,
                receivedSignature: receivedSignature.substring(0, 8) + '...'
            });
            await (0, firestore_1.storeOrphanedWebhook)(payload, 'Invalid signature', false);
            res.status(403).send('Invalid signature');
            return;
        }
        functions.logger.info('Webhook signature verified', { order_id: payload.order_id });
    }
    catch (error) {
        functions.logger.error('Signature verification error', { error: error.message });
        await (0, firestore_1.storeOrphanedWebhook)(payload, `Verification error: ${error.message}`, false);
        res.status(500).send('Signature verification failed');
        return;
    }
    // ========================================================================
    // EXTRACT WEBHOOK DATA
    // ========================================================================
    const { order_id, uuid, status: cryptomusStatus, txid, amount, currency, network } = payload;
    if (!order_id) {
        functions.logger.error('Webhook missing order_id', { payload });
        await (0, firestore_1.storeOrphanedWebhook)(payload, 'Missing order_id', true);
        res.status(200).send('OK'); // Return 200 to prevent retries
        return;
    }
    // ========================================================================
    // LOOKUP PAYOUT RECORD
    // ========================================================================
    const payoutRef = db.collection('payouts').doc(order_id);
    const payoutDoc = await payoutRef.get();
    if (!payoutDoc.exists) {
        functions.logger.warn('Payout not found for webhook', { order_id });
        await (0, firestore_1.storeOrphanedWebhook)(payload, 'Payout not found in Firestore', true);
        res.status(200).send('OK'); // Return 200 to prevent retries
        return;
    }
    const payout = payoutDoc.data();
    if (!payout) {
        functions.logger.error('Payout document empty', { order_id });
        await (0, firestore_1.storeOrphanedWebhook)(payload, 'Payout document empty', true);
        res.status(200).send('OK');
        return;
    }
    const previousStatus = payout === null || payout === void 0 ? void 0 : payout.status;
    // ========================================================================
    // MAP STATUS AND UPDATE PAYOUT
    // ========================================================================
    const newStatus = (0, validation_1.mapCryptomusStatus)(cryptomusStatus);
    functions.logger.info('Processing webhook status update', {
        order_id,
        previousStatus,
        cryptomusStatus,
        newStatus,
        txid
    });
    try {
        // Update payout record with webhook data
        const updateData = {
            status: newStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            webhook_history: admin.firestore.FieldValue.arrayUnion({
                receivedAt: new Date(),
                payload
            })
        };
        if (txid) {
            updateData.tx_hash = txid;
        }
        if (uuid && !(payout === null || payout === void 0 ? void 0 : payout.cryptomus_payout_id)) {
            updateData.cryptomus_payout_id = uuid;
        }
        // Update cryptomus_response with latest webhook data
        updateData.cryptomus_response = Object.assign(Object.assign({}, payout === null || payout === void 0 ? void 0 : payout.cryptomus_response), { latestWebhook: payload });
        await payoutRef.update(updateData);
        // ========================================================================
        // HANDLE STATUS-SPECIFIC ACTIONS
        // ========================================================================
        if (newStatus === 'completed' && previousStatus !== 'completed') {
            // Payout successful - deduct from org wallet
            await (0, firestore_1.completePayoutDeduction)(payout.orgId, payout.amount);
            functions.logger.info('Payout completed - funds deducted', {
                order_id,
                orgId: payout.orgId,
                amount: payout.amount,
                tx_hash: txid
            });
            // TODO: Send notification to hunter (email/FCM)
            // TODO: Update submission status to "paid"
        }
        else if (newStatus === 'failed' && previousStatus !== 'failed') {
            // Payout failed - release reserved funds
            await (0, firestore_1.releaseReservedFunds)(payout.orgId, payout.amount);
            functions.logger.error('Payout failed - funds released', {
                order_id,
                orgId: payout.orgId,
                amount: payout.amount,
                cryptomusStatus
            });
            // TODO: Send notification to admin (email/FCM)
            // TODO: Create support ticket for manual review
        }
        else if (newStatus === 'cancelled') {
            // Payout cancelled - release reserved funds
            await (0, firestore_1.releaseReservedFunds)(payout.orgId, payout.amount);
            functions.logger.warn('Payout cancelled - funds released', {
                order_id,
                orgId: payout.orgId,
                amount: payout.amount
            });
        }
        // ========================================================================
        // CREATE AUDIT LOG
        // ========================================================================
        await (0, firestore_1.createPayoutLog)({
            eventType: 'webhook',
            order_id,
            data: {
                previousStatus,
                newStatus,
                cryptomusStatus,
                request: payload,
                tx_hash: txid,
                metadata: {
                    uuid,
                    amount,
                    currency,
                    network
                }
            }
        });
        functions.logger.info('Webhook processed successfully', {
            order_id,
            previousStatus,
            newStatus
        });
        res.status(200).send('OK');
    }
    catch (error) {
        functions.logger.error('Error processing webhook', {
            order_id,
            error: error.message,
            stack: error.stack
        });
        // Log error but still return 200 to prevent Cryptomus retries
        // Store in orphans for manual investigation
        await (0, firestore_1.storeOrphanedWebhook)(Object.assign(Object.assign({}, payload), { processingError: error.message }), `Processing error: ${error.message}`, true);
        res.status(200).send('Error logged');
    }
});
//# sourceMappingURL=cryptomusWebhook.js.map