"use strict";
/**
 * Unit Tests for Cryptomus Client
 *
 * Tests signature generation, webhook verification, and API interactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const cryptomus_client_1 = require("../utils/cryptomus-client");
describe("CryptomusClient", () => {
    let client;
    beforeEach(() => {
        client = new cryptomus_client_1.CryptomusClient({
            merchantId: "test-merchant-123",
            payoutApiKey: "test-api-key-456",
            useSandbox: true,
        });
    });
    describe("signPayload", () => {
        it("should generate consistent signatures for the same payload", () => {
            const payload = {
                amount: "100.00",
                currency: "USDC",
                address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                order_id: "BH-PAYOUT-test-123",
                network: "POLYGON",
            };
            const signature1 = client.signPayload(payload);
            const signature2 = client.signPayload(payload);
            expect(signature1).toBe(signature2);
            expect(signature1).toHaveLength(32); // MD5 hash length
        });
        it("should generate different signatures for different payloads", () => {
            const payload1 = {
                amount: "100.00",
                currency: "USDC",
                address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                order_id: "BH-PAYOUT-test-123",
                network: "POLYGON",
            };
            const payload2 = Object.assign(Object.assign({}, payload1), { amount: "200.00" });
            const signature1 = client.signPayload(payload1);
            const signature2 = client.signPayload(payload2);
            expect(signature1).not.toBe(signature2);
        });
        it("should handle payload with special characters", () => {
            const payload = {
                amount: "100.00",
                currency: "USDC",
                address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                order_id: "BH-PAYOUT-test-123-©®™",
                network: "POLYGON",
                metadata: { note: "Test with émojis 🚀" },
            };
            expect(() => client.signPayload(payload)).not.toThrow();
            const signature = client.signPayload(payload);
            expect(signature).toHaveLength(32);
        });
    });
    describe("verifyWebhookSignature", () => {
        it("should verify valid webhook signatures", () => {
            const payload = {
                order_id: "BH-PAYOUT-test-123",
                uuid: "cryptomus-uuid-456",
                status: "paid",
                amount: "100.00",
                currency: "USDC",
                network: "POLYGON",
            };
            // Generate signature (simulating Cryptomus)
            const signature = client.signPayload(payload);
            // Add signature to payload (as Cryptomus would)
            const webhookPayload = Object.assign(Object.assign({}, payload), { sign: signature });
            const isValid = client.verifyWebhookSignature(webhookPayload, signature);
            expect(isValid).toBe(true);
        });
        it("should reject invalid webhook signatures", () => {
            const payload = {
                order_id: "BH-PAYOUT-test-123",
                uuid: "cryptomus-uuid-456",
                status: "paid",
                amount: "100.00",
                currency: "USDC",
                network: "POLYGON",
                sign: "invalid-signature-123",
            };
            const isValid = client.verifyWebhookSignature(payload, "invalid-signature-123");
            expect(isValid).toBe(false);
        });
        it("should reject tampered webhook payloads", () => {
            const originalPayload = {
                order_id: "BH-PAYOUT-test-123",
                uuid: "cryptomus-uuid-456",
                status: "paid",
                amount: "100.00",
                currency: "USDC",
                network: "POLYGON",
            };
            const signature = client.signPayload(originalPayload);
            // Tamper with the payload
            const tamperedPayload = Object.assign(Object.assign({}, originalPayload), { amount: "999.00", sign: signature });
            const isValid = client.verifyWebhookSignature(tamperedPayload, signature);
            expect(isValid).toBe(false);
        });
    });
    describe("Known Test Vector", () => {
        it("should match expected signature for documented test case", () => {
            // TODO: Replace with actual test vector from Cryptomus documentation
            // This is a placeholder test - update with official test data
            const testPayload = {
                amount: "100.000000",
                currency: "USDC",
                address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                order_id: "TEST-ORDER-001",
                network: "POLYGON",
            };
            const signature = client.signPayload(testPayload);
            // Verify signature is valid hex string
            expect(signature).toMatch(/^[a-f0-9]{32}$/i);
            // Verify it's deterministic
            const signature2 = client.signPayload(testPayload);
            expect(signature).toBe(signature2);
        });
    });
});
//# sourceMappingURL=cryptomus-client.test.js.map