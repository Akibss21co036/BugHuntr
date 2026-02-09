/**
 * Unit Tests for CVSS Engine
 *
 * Tests for vector parsing, base score calculation, and vector suggestion heuristics
 */

import {
  parseVectorString,
  vectorToString,
  computeBaseScore,
  suggestVectorFromSubmission,
  validateVectorString,
  SubmissionMetadata,
} from "../../cvss/cvssEngine";

describe("CVSS v3.1 Engine", () => {
  describe("parseVectorString", () => {
    it("should parse a valid CVSS v3.1 vector", () => {
      const vectorStr = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H";
      const vector = parseVectorString(vectorStr);

      expect(vector).not.toBeNull();
      expect(vector?.AV).toBe("N");
      expect(vector?.AC).toBe("L");
      expect(vector?.C).toBe("H");
    });

    it("should parse vector without CVSS:3.1 prefix", () => {
      const vectorStr = "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H";
      const vector = parseVectorString(vectorStr);

      expect(vector).not.toBeNull();
      expect(vector?.AV).toBe("N");
    });

    it("should return null for invalid format", () => {
      const vectorStr = "INVALID/VECTOR";
      const vector = parseVectorString(vectorStr);

      expect(vector).toBeNull();
    });

    it("should return null if required metrics are missing", () => {
      const vectorStr = "CVSS:3.1/AV:N/AC:L"; // Missing others
      const vector = parseVectorString(vectorStr);

      expect(vector).toBeNull();
    });
  });

  describe("vectorToString", () => {
    it("should convert vector object to string", () => {
      const vector = {
        AV: "N" as const,
        AC: "L" as const,
        PR: "N" as const,
        UI: "N" as const,
        S: "U" as const,
        C: "H" as const,
        I: "H" as const,
        A: "H" as const,
      };

      const result = vectorToString(vector);
      expect(result).toBe("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
    });
  });

  describe("computeBaseScore", () => {
    it("should compute score for critical RCE vector", () => {
      // Critical RCE: Network, Low complexity, No privileges, No interaction
      const vectorStr = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H";
      const result = computeBaseScore(vectorStr);

      expect(result).not.toBeNull();
      expect(result?.baseScore).toBe(10.0);
      expect(result?.severity).toBe("CRITICAL");
    });

    it("should compute score for high severity vulnerability", () => {
      // High: Network, Low complexity, None priv, None interaction, Low impact on one metric
      const vectorStr = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N";
      const result = computeBaseScore(vectorStr);

      expect(result).not.toBeNull();
      expect(result!.baseScore).toBeGreaterThanOrEqual(7.0);
      expect(result!.baseScore).toBeLessThan(9.0);
    });

    it("should compute score for low severity vulnerability", () => {
      // Low: Local, High complexity, Low priv, User interaction required
      const vectorStr = "CVSS:3.1/AV:L/AC:H/PR:L/UI:R/S:U/C:L/I:N/A:N";
      const result = computeBaseScore(vectorStr);

      expect(result).not.toBeNull();
      expect(result!.baseScore).toBeLessThan(4.0);
    });

    it("should return 0 for vector with no impact", () => {
      const vectorStr = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N";
      const result = computeBaseScore(vectorStr);

      expect(result?.baseScore).toBe(0.0);
      expect(result?.severity).toBe("NONE");
    });

    it("should handle invalid vector string", () => {
      const result = computeBaseScore("INVALID");
      expect(result).toBeNull();
    });
  });

  describe("validateVectorString", () => {
    it("should validate correct vector", () => {
      const result = validateVectorString(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
      );
      expect(result.valid).toBe(true);
    });

    it("should reject invalid metric value", () => {
      const result = validateVectorString(
        "CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("suggestVectorFromSubmission", () => {
    it("should suggest RCE-like vector for code execution vulnerability", () => {
      const metadata: SubmissionMetadata = {
        vulnerabilityType: "RCE",
        authenticatedRequired: false,
        userInteractionRequired: false,
        affectedAssetType: "api_endpoint",
      };

      const vector = suggestVectorFromSubmission(metadata);

      expect(vector.AV).toBe("N");
      expect(vector.C).toBe("H");
      expect(vector.I).toBe("H");
      expect(vector.A).toBe("H");
    });

    it("should suggest SQL injection vector", () => {
      const metadata: SubmissionMetadata = {
        vulnerabilityType: "SQLi",
        authenticatedRequired: false,
        affectedAssetType: "web_app",
      };

      const vector = suggestVectorFromSubmission(metadata);

      expect(vector.C).toBe("H");
      expect(vector.I).toBe("H");
    });

    it("should suggest XSS vector", () => {
      const metadata: SubmissionMetadata = {
        vulnerabilityType: "XSS",
        userInteractionRequired: true,
        affectedAssetType: "web_app",
      };

      const vector = suggestVectorFromSubmission(metadata);

      expect(vector.C).toBe("H");
      expect(vector.I).toBe("H");
    });

    it("should suggest CSRF vector", () => {
      const metadata: SubmissionMetadata = {
        vulnerabilityType: "CSRF",
        affectedAssetType: "web_app",
      };

      const vector = suggestVectorFromSubmission(metadata);

      expect(vector.UI).toBe("R"); // User interaction required
      expect(vector.I).toBe("H");
    });

    it("should adjust AV for internal systems", () => {
      const metadata: SubmissionMetadata = {
        vulnerabilityType: "RCE",
        affectedAssetType: "internal_system",
      };

      const vector = suggestVectorFromSubmission(metadata);

      expect(vector.AV).toBe("A"); // Adjacent, not Network
    });
  });
});
