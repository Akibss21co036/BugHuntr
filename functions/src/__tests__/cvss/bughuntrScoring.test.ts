/**
 * Unit Tests for BugHuntr Scoring System
 */

import {
  computeBugHuntrScore,
  BugHuntrScoringFactors,
  getDefaultScoringFactorsForAsset,
  adjustForExploitability,
  adjustForProofOfConcept,
  mapScoreToRewardTier,
  computeRewardAmount,
  OrgPayoutPolicy,
  DEFAULT_REWARD_TIER_TABLE,
} from "../../cvss/bughuntrScoring";

describe("BugHuntr Scoring System", () => {
  describe("computeBugHuntrScore", () => {
    it("should compute score with default factors", () => {
      const result = computeBugHuntrScore(8.5, {});

      expect(result.score).toBeDefined();
      expect(result.cvssBase).toBe(8.5);
      expect(result.exploitabilityModifier).toBe(1.0);
      expect(result.businessImpactMultiplier).toBe(1.0);
      expect(result.confidenceFactor).toBe(0.85);
    });

    it("should apply multipliers correctly", () => {
      const factors: BugHuntrScoringFactors = {
        exploitabilityModifier: 1.1,
        businessImpactMultiplier: 1.5,
        confidenceFactor: 1.0,
      };

      const result = computeBugHuntrScore(8.0, factors);

      // 8.0 * 1.1 * 1.5 * 1.0 = 13.2, clamped to 10.0
      expect(result.score).toBe(10.0);
    });

    it("should clamp score to 0-10 range", () => {
      const result = computeBugHuntrScore(10.0, {});
      expect(result.score).toBeLessThanOrEqual(10.0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it("should reject invalid CVSS base", () => {
      expect(() => {
        computeBugHuntrScore(11.0, {});
      }).toThrow();

      expect(() => {
        computeBugHuntrScore(-1.0, {});
      }).toThrow();
    });

    it("should reject invalid factors", () => {
      expect(() => {
        computeBugHuntrScore(8.0, { exploitabilityModifier: 3.0 });
      }).toThrow();

      expect(() => {
        computeBugHuntrScore(8.0, { confidenceFactor: 0.5 });
      }).toThrow();
    });
  });

  describe("getDefaultScoringFactorsForAsset", () => {
    it("should return higher multiplier for critical assets", () => {
      const paymentFactors = getDefaultScoringFactorsForAsset("payment_system");
      const docFactors = getDefaultScoringFactorsForAsset("documentation");

      expect(paymentFactors.businessImpactMultiplier ?? 1.0).toBeGreaterThan(
        docFactors.businessImpactMultiplier ?? 1.0
      );
    });

    it("should use org-specific multipliers if provided", () => {
      const customMap = {
        custom_asset: 2.5,
      };

      const result = getDefaultScoringFactorsForAsset(
        "custom_asset",
        customMap
      );
      expect(result.businessImpactMultiplier).toBe(2.5);
    });
  });

  describe("adjustForExploitability", () => {
    it("should increase EM if public PoC exists", () => {
      const baseFactors = { exploitabilityModifier: 1.0 };
      const result = adjustForExploitability(baseFactors, true, false);

      expect(result.exploitabilityModifier).toBeGreaterThan(1.0);
      expect(result.exploitabilityModifier).toBeLessThanOrEqual(1.2);
    });

    it("should increase EM if vulnerability is known", () => {
      const baseFactors = { exploitabilityModifier: 1.0 };
      const result = adjustForExploitability(baseFactors, false, true);

      expect(result.exploitabilityModifier).toBeGreaterThan(1.0);
    });

    it("should cap EM at 1.2", () => {
      const baseFactors = { exploitabilityModifier: 1.15 };
      const result = adjustForExploitability(baseFactors, true, true);

      expect(result.exploitabilityModifier).toBeLessThanOrEqual(1.2);
    });
  });

  describe("adjustForProofOfConcept", () => {
    it("should set CF to 1.0 for full working exploit", () => {
      const baseFactors = { confidenceFactor: 0.7 };
      const result = adjustForProofOfConcept(
        baseFactors,
        "full_working_exploit"
      );

      expect(result.confidenceFactor).toBe(1.0);
    });

    it("should set CF to 0.9 for partial PoC", () => {
      const baseFactors = { confidenceFactor: 0.7 };
      const result = adjustForProofOfConcept(baseFactors, "partial_poc");

      expect(result.confidenceFactor).toBe(0.9);
    });

    it("should set CF to 0.7 for theoretical", () => {
      const baseFactors = { confidenceFactor: 1.0 };
      const result = adjustForProofOfConcept(baseFactors, "theoretical");

      expect(result.confidenceFactor).toBe(0.7);
    });
  });

  describe("mapScoreToRewardTier", () => {
    it("should map critical score to CRITICAL tier", () => {
      const tier = mapScoreToRewardTier(9.5);

      expect(tier).not.toBeNull();
      expect(tier?.tierName).toBe("CRITICAL");
      expect(tier?.rewardMultiplier).toBe(2.0);
    });

    it("should map high score to HIGH tier", () => {
      const tier = mapScoreToRewardTier(7.5);

      expect(tier?.tierName).toBe("HIGH");
      expect(tier?.rewardMultiplier).toBe(1.5);
    });

    it("should map medium score to MEDIUM tier", () => {
      const tier = mapScoreToRewardTier(5.0);

      expect(tier?.tierName).toBe("MEDIUM");
      expect(tier?.rewardMultiplier).toBe(1.0);
    });

    it("should return null for unmapped score", () => {
      const tier = mapScoreToRewardTier(100);
      expect(tier).toBeNull();
    });
  });

  describe("computeRewardAmount", () => {
    const policy: OrgPayoutPolicy = {
      minScoreToPay: 4.0,
      rewardMultiplierTable: DEFAULT_REWARD_TIER_TABLE,
      baseRewardPerSubmission: 10000, // $100
    };

    it("should return null if score below threshold", () => {
      const result = computeRewardAmount(3.0, policy);
      expect(result).toBeNull();
    });

    it("should compute reward for qualifying score", () => {
      const result = computeRewardAmount(7.5, policy);

      expect(result).not.toBeNull();
      expect(result?.rewardCents).toBe(15000); // $150 (1.5x multiplier)
      expect(result?.tier.tierName).toBe("HIGH");
    });

    it("should compute critical reward", () => {
      const result = computeRewardAmount(9.5, policy);

      expect(result?.rewardCents).toBe(20000); // $200 (2.0x multiplier)
    });
  });
});
