"use strict";
/**
 * Wallet Validation Utilities
 *
 * Provides wallet address validation for different blockchain networks.
 * Non-blockchain engineers: This validates that crypto wallet addresses
 * are in the correct format before sending funds.
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
exports.validateWalletAddress = validateWalletAddress;
exports.validateAmount = validateAmount;
exports.formatAmountForCryptomus = formatAmountForCryptomus;
exports.parseAmountToSmallestUnits = parseAmountToSmallestUnits;
exports.getExplorerUrl = getExplorerUrl;
exports.generateOrderId = generateOrderId;
exports.mapCryptomusStatus = mapCryptomusStatus;
const functions = __importStar(require("firebase-functions"));
/**
 * Validate cryptocurrency wallet address
 *
 * Basic validation rules:
 * - Ethereum/Polygon: 0x followed by 40 hex characters
 * - Bitcoin: Starts with 1, 3, or bc1, length 26-62
 * - Tron: Starts with T, length 34
 *
 * @param address - Wallet address to validate
 * @param network - Blockchain network
 * @returns Validation result
 */
function validateWalletAddress(address, network) {
    if (!address || typeof address !== 'string') {
        return { isValid: false, error: 'Address is required' };
    }
    const trimmedAddress = address.trim();
    switch (network.toUpperCase()) {
        case 'ETHEREUM':
        case 'ETH':
        case 'POLYGON':
        case 'MATIC':
        case 'BSC':
        case 'ARBITRUM':
        case 'OPTIMISM':
            // EVM-compatible address: 0x followed by 40 hex characters
            if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
                return {
                    isValid: false,
                    error: `Invalid ${network} address format. Expected 0x followed by 40 hex characters.`
                };
            }
            break;
        case 'BITCOIN':
        case 'BTC':
            // Bitcoin addresses (legacy, segwit, bech32)
            if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,62}$/.test(trimmedAddress) && // Legacy/P2SH
                !/^bc1[a-z0-9]{39,87}$/.test(trimmedAddress) // Bech32
            ) {
                return {
                    isValid: false,
                    error: 'Invalid Bitcoin address format'
                };
            }
            break;
        case 'TRON':
        case 'TRX':
            // Tron addresses start with T and are 34 characters
            if (!/^T[a-zA-Z0-9]{33}$/.test(trimmedAddress)) {
                return {
                    isValid: false,
                    error: 'Invalid Tron address format. Expected T followed by 33 characters.'
                };
            }
            break;
        case 'LITECOIN':
        case 'LTC':
            // Litecoin addresses
            if (!/^[LM3][a-km-zA-HJ-NP-Z1-9]{26,62}$/.test(trimmedAddress) &&
                !/^ltc1[a-z0-9]{39,87}$/.test(trimmedAddress)) {
                return {
                    isValid: false,
                    error: 'Invalid Litecoin address format'
                };
            }
            break;
        default:
            functions.logger.warn('Unknown network for validation', { network });
            // For unknown networks, do basic checks
            if (trimmedAddress.length < 20 || trimmedAddress.length > 100) {
                return {
                    isValid: false,
                    error: `Address length suspicious for network ${network}`
                };
            }
    }
    return { isValid: true };
}
/**
 * Validate payout amount
 *
 * @param amount - Amount to validate
 * @param currency - Currency code
 * @returns Validation result
 */
function validateAmount(amount, currency) {
    var _a;
    if (typeof amount !== 'number' || isNaN(amount)) {
        return { isValid: false, error: 'Amount must be a valid number' };
    }
    if (amount <= 0) {
        return { isValid: false, error: 'Amount must be greater than zero' };
    }
    // Check for reasonable maximum (prevent mistakes)
    const MAX_AMOUNT = 1000000; // 1 million units
    if (amount > MAX_AMOUNT) {
        return {
            isValid: false,
            error: `Amount ${amount} exceeds maximum allowed (${MAX_AMOUNT})`
        };
    }
    // Check decimal precision (most crypto has max 18 decimals, USDC has 6)
    const decimals = ((_a = amount.toString().split('.')[1]) === null || _a === void 0 ? void 0 : _a.length) || 0;
    if (decimals > 18) {
        return {
            isValid: false,
            error: 'Amount has too many decimal places'
        };
    }
    return { isValid: true };
}
/**
 * Format amount for Cryptomus API (convert to string with proper decimals)
 *
 * @param amount - Numeric amount
 * @param currency - Currency code
 * @returns Formatted string amount
 */
function formatAmountForCryptomus(amount, currency) {
    // Most stablecoins use 6 decimals (USDC, USDT)
    const decimals = ['USDC', 'USDT'].includes(currency.toUpperCase()) ? 6 : 18;
    // Convert smallest units to full units
    // e.g., 1000000 micro-USDC -> "1.000000" USDC
    const fullAmount = amount / Math.pow(10, decimals);
    return fullAmount.toFixed(decimals);
}
/**
 * Parse amount from user input to smallest units
 *
 * @param inputAmount - Amount in full units (e.g., "1.50" USDC)
 * @param currency - Currency code
 * @returns Amount in smallest units (e.g., 1500000 micro-USDC)
 */
function parseAmountToSmallestUnits(inputAmount, currency) {
    const decimals = ['USDC', 'USDT'].includes(currency.toUpperCase()) ? 6 : 18;
    const amount = typeof inputAmount === 'string' ? parseFloat(inputAmount) : inputAmount;
    return Math.floor(amount * Math.pow(10, decimals));
}
/**
 * Get blockchain explorer URL for transaction
 *
 * @param txHash - Transaction hash
 * @param network - Blockchain network
 * @returns Explorer URL
 */
function getExplorerUrl(txHash, network) {
    const explorers = {
        'ETHEREUM': `https://etherscan.io/tx/${txHash}`,
        'ETH': `https://etherscan.io/tx/${txHash}`,
        'POLYGON': `https://polygonscan.com/tx/${txHash}`,
        'MATIC': `https://polygonscan.com/tx/${txHash}`,
        'BSC': `https://bscscan.com/tx/${txHash}`,
        'ARBITRUM': `https://arbiscan.io/tx/${txHash}`,
        'OPTIMISM': `https://optimistic.etherscan.io/tx/${txHash}`,
        'BITCOIN': `https://blockchain.com/btc/tx/${txHash}`,
        'BTC': `https://blockchain.com/btc/tx/${txHash}`,
        'TRON': `https://tronscan.org/#/transaction/${txHash}`,
        'TRX': `https://tronscan.org/#/transaction/${txHash}`,
        'LITECOIN': `https://blockchair.com/litecoin/transaction/${txHash}`,
        'LTC': `https://blockchair.com/litecoin/transaction/${txHash}`
    };
    return explorers[network.toUpperCase()] || `https://blockscan.com/tx/${txHash}`;
}
/**
 * Generate unique order_id for idempotency
 *
 * Format: BH-PAYOUT-{submissionId} or BH-PAYOUT-{huntId}-{submissionId}
 *
 * @param submissionId - Submission ID
 * @param huntId - Optional hunt ID
 * @returns Unique order ID
 */
function generateOrderId(submissionId, huntId) {
    if (huntId) {
        return `BH-PAYOUT-${huntId}-${submissionId}`;
    }
    return `BH-PAYOUT-${submissionId}`;
}
/**
 * Map Cryptomus status to internal payout status
 *
 * @param cryptomusStatus - Status from Cryptomus
 * @returns Internal status
 */
function mapCryptomusStatus(cryptomusStatus) {
    const statusMap = {
        'paid': 'completed',
        'process': 'processing',
        'wrong_amount': 'failed',
        'cancel': 'cancelled',
        'system_fail': 'failed',
        'refund_process': 'failed',
        'refund_fail': 'failed',
        'refund_paid': 'failed',
        'fail': 'failed'
    };
    return statusMap[cryptomusStatus.toLowerCase()] || 'processing';
}
//# sourceMappingURL=validation.js.map