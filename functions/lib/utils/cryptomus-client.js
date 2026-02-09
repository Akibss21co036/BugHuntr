"use strict";
/**
 * Cryptomus API Client
 *
 * Handles all communication with Cryptomus Payout API including:
 * - Request signing per Cryptomus specification
 * - Payout creation
 * - Webhook signature verification
 * - Payout history retrieval
 *
 * Documentation: https://doc.cryptomus.com/business/payouts
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptomusClient = void 0;
exports.initializeCryptomusClient = initializeCryptomusClient;
const crypto = __importStar(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const functions = __importStar(require("firebase-functions"));
// TODO: Verify exact API endpoints with Cryptomus documentation
const CRYPTOMUS_API_BASE = 'https://api.cryptomus.com/v1';
const CRYPTOMUS_SANDBOX_BASE = 'https://api.cryptomus.com/v1'; // Update if sandbox URL differs
class CryptomusClient {
    constructor(config) {
        this.config = config;
        this.axios = axios_1.default.create({
            baseURL: config.useSandbox ? CRYPTOMUS_SANDBOX_BASE : CRYPTOMUS_API_BASE,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Sign request payload according to Cryptomus specification
     *
     * TODO: Verify exact signing method with official documentation
     * https://doc.cryptomus.com/business/authentication
     *
     * Current implementation assumes: MD5(base64(jsonPayload) + apiKey)
     * Alternative methods to verify:
     * - HMAC-SHA256
     * - MD5(jsonString + apiKey) without base64
     * - Other variations
     *
     * @param payload - Request payload object
     * @returns Signature string
     */
    signPayload(payload) {
        try {
            const jsonString = JSON.stringify(payload);
            const base64Payload = Buffer.from(jsonString).toString('base64');
            const signatureInput = base64Payload + this.config.payoutApiKey;
            const signature = crypto
                .createHash('md5')
                .update(signatureInput)
                .digest('hex');
            functions.logger.info('Payload signed', {
                payloadLength: jsonString.length,
                signaturePreview: signature.substring(0, 8) + '...'
            });
            return signature;
        }
        catch (error) {
            functions.logger.error('Error signing payload', { error });
            throw new Error(`Failed to sign payload: ${error}`);
        }
    }
    /**
     * Verify webhook signature
     *
     * TODO: Confirm webhook signature verification method with Cryptomus docs
     * https://doc.cryptomus.com/business/payouts/webhook
     *
     * @param payload - Webhook payload
     * @param receivedSignature - Signature from webhook
     * @returns Whether signature is valid
     */
    verifyWebhookSignature(payload, receivedSignature) {
        try {
            // Remove the signature field from payload before verification
            const payloadCopy = Object.assign({}, payload);
            delete payloadCopy.sign;
            const expectedSignature = this.signPayload(payloadCopy);
            const isValid = expectedSignature === receivedSignature;
            functions.logger.info('Webhook signature verification', {
                isValid,
                receivedPreview: receivedSignature.substring(0, 8) + '...',
                expectedPreview: expectedSignature.substring(0, 8) + '...'
            });
            return isValid;
        }
        catch (error) {
            functions.logger.error('Error verifying webhook signature', { error });
            return false;
        }
    }
    /**
     * Create a payout via Cryptomus API
     *
     * @param params - Payout parameters
     * @returns Cryptomus API response
     */
    async createPayout(params) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        try {
            const payload = Object.assign({ amount: params.amount, currency: params.currency, address: params.address, order_id: params.order_id, network: params.network }, (params.url_callback && { url_callback: params.url_callback }));
            const signature = this.signPayload(payload);
            functions.logger.info('Creating Cryptomus payout', {
                order_id: params.order_id,
                amount: params.amount,
                currency: params.currency,
                network: params.network
            });
            const response = await this.axios.post('/payout', payload, {
                headers: {
                    'merchant': this.config.merchantId,
                    'sign': signature
                }
            });
            functions.logger.info('Cryptomus payout created successfully', {
                order_id: params.order_id,
                uuid: (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b.uuid,
                status: (_d = (_c = response.data) === null || _c === void 0 ? void 0 : _c.result) === null || _d === void 0 ? void 0 : _d.status
            });
            return response.data;
        }
        catch (error) {
            functions.logger.error('Cryptomus payout creation failed', {
                order_id: params.order_id,
                error: ((_e = error.response) === null || _e === void 0 ? void 0 : _e.data) || error.message,
                status: (_f = error.response) === null || _f === void 0 ? void 0 : _f.status
            });
            throw {
                code: ((_g = error.response) === null || _g === void 0 ? void 0 : _g.status) || 'UNKNOWN',
                message: ((_j = (_h = error.response) === null || _h === void 0 ? void 0 : _h.data) === null || _j === void 0 ? void 0 : _j.message) || error.message,
                details: (_k = error.response) === null || _k === void 0 ? void 0 : _k.data
            };
        }
    }
    /**
     * Retrieve payout history from Cryptomus
     * Used for reconciliation
     *
     * @param params - Query parameters
     * @returns List of payouts
     */
    async getPayoutHistory(params) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        try {
            const payload = Object.assign(Object.assign(Object.assign({}, ((params === null || params === void 0 ? void 0 : params.date_from) && { date_from: params.date_from })), ((params === null || params === void 0 ? void 0 : params.date_to) && { date_to: params.date_to })), { page: (params === null || params === void 0 ? void 0 : params.page) || 1, limit: (params === null || params === void 0 ? void 0 : params.limit) || 100 });
            const signature = this.signPayload(payload);
            functions.logger.info('Fetching Cryptomus payout history', params);
            const response = await this.axios.post('/payout/list', payload, {
                headers: {
                    'merchant': this.config.merchantId,
                    'sign': signature
                }
            });
            functions.logger.info('Payout history retrieved', {
                count: ((_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b.items) === null || _c === void 0 ? void 0 : _c.length) || 0
            });
            return response.data;
        }
        catch (error) {
            functions.logger.error('Failed to fetch payout history', {
                error: ((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) || error.message
            });
            throw {
                code: ((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) || 'UNKNOWN',
                message: ((_g = (_f = error.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.message) || error.message,
                details: (_h = error.response) === null || _h === void 0 ? void 0 : _h.data
            };
        }
    }
    /**
     * Get details of a specific payout
     *
     * @param uuid - Cryptomus payout UUID
     * @returns Payout details
     */
    async getPayoutDetails(uuid) {
        var _a, _b, _c, _d, _e;
        try {
            const payload = { uuid };
            const signature = this.signPayload(payload);
            const response = await this.axios.post('/payout/info', payload, {
                headers: {
                    'merchant': this.config.merchantId,
                    'sign': signature
                }
            });
            return response.data;
        }
        catch (error) {
            functions.logger.error('Failed to fetch payout details', {
                uuid,
                error: ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message
            });
            throw {
                code: ((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 'UNKNOWN',
                message: ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || error.message,
                details: (_e = error.response) === null || _e === void 0 ? void 0 : _e.data
            };
        }
    }
}
exports.CryptomusClient = CryptomusClient;
/**
 * Initialize Cryptomus client with configuration from Firebase Functions config
 * or environment variables
 */
function initializeCryptomusClient() {
    // Try to get config from Firebase Functions config first
    const config = functions.config().cryptomus;
    if (!(config === null || config === void 0 ? void 0 : config.merchant_id) || !(config === null || config === void 0 ? void 0 : config.payout_key)) {
        throw new Error('Cryptomus configuration not found. Please set using:\n' +
            'firebase functions:config:set cryptomus.merchant_id="YOUR_MERCHANT_ID" cryptomus.payout_key="YOUR_API_KEY"');
    }
    return new CryptomusClient({
        merchantId: config.merchant_id,
        payoutApiKey: config.payout_key,
        useSandbox: config.use_sandbox === 'true'
    });
}
//# sourceMappingURL=cryptomus-client.js.map