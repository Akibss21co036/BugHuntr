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

import * as crypto from "crypto";
import axios, { AxiosInstance } from "axios";
import * as functions from "firebase-functions";

// TODO: Verify exact API endpoints with Cryptomus documentation
const CRYPTOMUS_API_BASE = "https://api.cryptomus.com/v1";
const CRYPTOMUS_SANDBOX_BASE = "https://api.cryptomus.com/v1"; // Update if sandbox URL differs

interface CryptomusConfig {
  merchantId: string;
  payoutApiKey: string;
  useSandbox?: boolean;
}

export class CryptomusClient {
  private config: CryptomusConfig;
  private axios: AxiosInstance;

  constructor(config: CryptomusConfig) {
    this.config = config;

    this.axios = axios.create({
      baseURL: config.useSandbox ? CRYPTOMUS_SANDBOX_BASE : CRYPTOMUS_API_BASE,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
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
  signPayload(payload: any): string {
    try {
      const jsonString = JSON.stringify(payload);
      const base64Payload = Buffer.from(jsonString).toString("base64");
      const signatureInput = base64Payload + this.config.payoutApiKey;

      const signature = crypto
        .createHash("md5")
        .update(signatureInput)
        .digest("hex");

      functions.logger.info("Payload signed", {
        payloadLength: jsonString.length,
        signaturePreview: signature.substring(0, 8) + "...",
      });

      return signature;
    } catch (error) {
      functions.logger.error("Error signing payload", { error });
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
  verifyWebhookSignature(payload: any, receivedSignature: string): boolean {
    try {
      // Remove the signature field from payload before verification
      const payloadCopy = { ...payload };
      delete payloadCopy.sign;

      const expectedSignature = this.signPayload(payloadCopy);
      const isValid = expectedSignature === receivedSignature;

      functions.logger.info("Webhook signature verification", {
        isValid,
        receivedPreview: receivedSignature.substring(0, 8) + "...",
        expectedPreview: expectedSignature.substring(0, 8) + "...",
      });

      return isValid;
    } catch (error) {
      functions.logger.error("Error verifying webhook signature", { error });
      return false;
    }
  }

  /**
   * Create a payout via Cryptomus API
   *
   * @param params - Payout parameters
   * @returns Cryptomus API response
   */
  async createPayout(params: {
    amount: string;
    currency: string;
    address: string;
    order_id: string;
    network: string;
    url_callback?: string;
  }) {
    try {
      const payload = {
        amount: params.amount,
        currency: params.currency,
        address: params.address,
        order_id: params.order_id,
        network: params.network,
        ...(params.url_callback && { url_callback: params.url_callback }),
      };

      const signature = this.signPayload(payload);

      functions.logger.info("Creating Cryptomus payout", {
        order_id: params.order_id,
        amount: params.amount,
        currency: params.currency,
        network: params.network,
      });

      const response = await this.axios.post("/payout", payload, {
        headers: {
          merchant: this.config.merchantId,
          sign: signature,
        },
      });

      functions.logger.info("Cryptomus payout created successfully", {
        order_id: params.order_id,
        uuid: response.data?.result?.uuid,
        status: response.data?.result?.status,
      });

      return response.data;
    } catch (error: any) {
      functions.logger.error("Cryptomus payout creation failed", {
        order_id: params.order_id,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });

      throw {
        code: error.response?.status || "UNKNOWN",
        message: error.response?.data?.message || error.message,
        details: error.response?.data,
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
  async getPayoutHistory(params?: {
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const payload = {
        ...(params?.date_from && { date_from: params.date_from }),
        ...(params?.date_to && { date_to: params.date_to }),
        page: params?.page || 1,
        limit: params?.limit || 100,
      };

      const signature = this.signPayload(payload);

      functions.logger.info("Fetching Cryptomus payout history", params);

      const response = await this.axios.post("/payout/list", payload, {
        headers: {
          merchant: this.config.merchantId,
          sign: signature,
        },
      });

      functions.logger.info("Payout history retrieved", {
        count: response.data?.result?.items?.length || 0,
      });

      return response.data;
    } catch (error: any) {
      functions.logger.error("Failed to fetch payout history", {
        error: error.response?.data || error.message,
      });

      throw {
        code: error.response?.status || "UNKNOWN",
        message: error.response?.data?.message || error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Get details of a specific payout
   *
   * @param uuid - Cryptomus payout UUID
   * @returns Payout details
   */
  async getPayoutDetails(uuid: string) {
    try {
      const payload = { uuid };
      const signature = this.signPayload(payload);

      const response = await this.axios.post("/payout/info", payload, {
        headers: {
          merchant: this.config.merchantId,
          sign: signature,
        },
      });

      return response.data;
    } catch (error: any) {
      functions.logger.error("Failed to fetch payout details", {
        uuid,
        error: error.response?.data || error.message,
      });

      throw {
        code: error.response?.status || "UNKNOWN",
        message: error.response?.data?.message || error.message,
        details: error.response?.data,
      };
    }
  }
}

/**
 * Initialize Cryptomus client with configuration from Firebase Functions config
 * or environment variables
 */
export function initializeCryptomusClient(): CryptomusClient {
  // Try to get config from Firebase Functions config first
  const config = functions.config().cryptomus;

  if (!config?.merchant_id || !config?.payout_key) {
    throw new Error(
      "Cryptomus configuration not found. Please set using:\n" +
        'firebase functions:config:set cryptomus.merchant_id="YOUR_MERCHANT_ID" cryptomus.payout_key="YOUR_API_KEY"'
    );
  }

  return new CryptomusClient({
    merchantId: config.merchant_id,
    payoutApiKey: config.payout_key,
    useSandbox: config.use_sandbox === "true",
  });
}
