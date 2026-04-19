/**
 * Wallet Validation Utilities
 *
 * Provides wallet address validation for different blockchain networks.
 * Non-blockchain engineers: This validates that crypto wallet addresses
 * are in the correct format before sending funds.
 */

import * as functions from "firebase-functions";

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
export function validateWalletAddress(
  address: string,
  network: string
): { isValid: boolean; error?: string } {
  if (!address || typeof address !== "string") {
    return { isValid: false, error: "Address is required" };
  }

  const trimmedAddress = address.trim();

  switch (network.toUpperCase()) {
    case "ETHEREUM":
    case "ETH":
    case "POLYGON":
    case "MATIC":
    case "BSC":
    case "ARBITRUM":
    case "OPTIMISM":
      // EVM-compatible address: 0x followed by 40 hex characters
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
        return {
          isValid: false,
          error: `Invalid ${network} address format. Expected 0x followed by 40 hex characters.`,
        };
      }
      break;

    case "BITCOIN":
    case "BTC":
      // Bitcoin addresses (legacy, segwit, bech32)
      if (
        !/^[13][a-km-zA-HJ-NP-Z1-9]{25,62}$/.test(trimmedAddress) && // Legacy/P2SH
        !/^bc1[a-z0-9]{39,87}$/.test(trimmedAddress) // Bech32
      ) {
        return {
          isValid: false,
          error: "Invalid Bitcoin address format",
        };
      }
      break;

    case "TRON":
    case "TRX":
      // Tron addresses start with T and are 34 characters
      if (!/^T[a-zA-Z0-9]{33}$/.test(trimmedAddress)) {
        return {
          isValid: false,
          error:
            "Invalid Tron address format. Expected T followed by 33 characters.",
        };
      }
      break;

    case "LITECOIN":
    case "LTC":
      // Litecoin addresses
      if (
        !/^[LM3][a-km-zA-HJ-NP-Z1-9]{26,62}$/.test(trimmedAddress) &&
        !/^ltc1[a-z0-9]{39,87}$/.test(trimmedAddress)
      ) {
        return {
          isValid: false,
          error: "Invalid Litecoin address format",
        };
      }
      break;

    default:
      functions.logger.warn("Unknown network for validation", { network });
      // For unknown networks, do basic checks
      if (trimmedAddress.length < 20 || trimmedAddress.length > 100) {
        return {
          isValid: false,
          error: `Address length suspicious for network ${network}`,
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
export function validateAmount(
  amount: number,
  currency: string
): { isValid: boolean; error?: string } {
  if (typeof amount !== "number" || isNaN(amount)) {
    return { isValid: false, error: "Amount must be a valid number" };
  }

  if (amount <= 0) {
    return { isValid: false, error: "Amount must be greater than zero" };
  }

  // Check for reasonable maximum (prevent mistakes)
  const MAX_AMOUNT = 1000000; // 1 million units
  if (amount > MAX_AMOUNT) {
    return {
      isValid: false,
      error: `Amount ${amount} exceeds maximum allowed (${MAX_AMOUNT})`,
    };
  }

  // Check decimal precision (most crypto has max 18 decimals, USDC has 6)
  const decimals = amount.toString().split(".")[1]?.length || 0;
  if (decimals > 18) {
    return {
      isValid: false,
      error: "Amount has too many decimal places",
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
export function formatAmountForCryptomus(
  amount: number,
  currency: string
): string {
  // Most stablecoins use 6 decimals (USDC, USDT)
  const decimals = ["USDC", "USDT"].includes(currency.toUpperCase()) ? 6 : 18;

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
export function parseAmountToSmallestUnits(
  inputAmount: string | number,
  currency: string
): number {
  const decimals = ["USDC", "USDT"].includes(currency.toUpperCase()) ? 6 : 18;
  const amount =
    typeof inputAmount === "string" ? parseFloat(inputAmount) : inputAmount;

  return Math.floor(amount * Math.pow(10, decimals));
}

/**
 * Get blockchain explorer URL for transaction
 *
 * @param txHash - Transaction hash
 * @param network - Blockchain network
 * @returns Explorer URL
 */
export function getExplorerUrl(txHash: string, network: string): string {
  const explorers: Record<string, string> = {
    ETHEREUM: `https://etherscan.io/tx/${txHash}`,
    ETH: `https://etherscan.io/tx/${txHash}`,
    POLYGON: `https://polygonscan.com/tx/${txHash}`,
    MATIC: `https://polygonscan.com/tx/${txHash}`,
    BSC: `https://bscscan.com/tx/${txHash}`,
    ARBITRUM: `https://arbiscan.io/tx/${txHash}`,
    OPTIMISM: `https://optimistic.etherscan.io/tx/${txHash}`,
    BITCOIN: `https://blockchain.com/btc/tx/${txHash}`,
    BTC: `https://blockchain.com/btc/tx/${txHash}`,
    TRON: `https://tronscan.org/#/transaction/${txHash}`,
    TRX: `https://tronscan.org/#/transaction/${txHash}`,
    LITECOIN: `https://blockchair.com/litecoin/transaction/${txHash}`,
    LTC: `https://blockchair.com/litecoin/transaction/${txHash}`,
  };

  return (
    explorers[network.toUpperCase()] || `https://blockscan.com/tx/${txHash}`
  );
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
export function generateOrderId(submissionId: string, huntId?: string): string {
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
export function mapCryptomusStatus(cryptomusStatus: string): string {
  const statusMap: Record<string, string> = {
    paid: "completed",
    process: "processing",
    wrong_amount: "failed",
    cancel: "cancelled",
    system_fail: "failed",
    refund_process: "failed",
    refund_fail: "failed",
    refund_paid: "failed",
    fail: "failed",
  };

  return statusMap[cryptomusStatus.toLowerCase()] || "processing";
}
