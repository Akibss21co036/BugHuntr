/**
 * BugHuntr Internal Scoring System
 *
 * BugHuntr uses an internal severity score that multiplies the CVSS base score
 * with organization and asset-specific factors to determine reward tiers and
 * auto-rejection thresholds.
 *
 * Formula:
 * BugHuntrScore = clamp(CVSS_base * EM * BIM * CF, 0, 10)
 *
 * Where:
 * - CVSS_base: Official CVSS v3.1 base score (0.0 - 10.0)
 * - EM: Exploitability Modifier (1.0 base; 1.1-1.2 if known exploit/PoC exists)
 * - BIM: Business Impact Multiplier (org + asset specific; 0.5-2.0)
 * - CF: Confidence Factor (0.7-1.0 based on PoC completeness and evidence quality)
 */

export interface BugHuntrScoringFactors {
  exploitabilityModifier?: number; // default: 1.0
  businessImpactMultiplier?: number; // default: 1.0
  confidenceFactor?: number; // default: 0.85
}

export interface BugHuntrScoreBreakdown {
  score: number; // Final clamped score (0.0 - 10.0)
  cvssBase: number;
  exploitabilityModifier: number;
  businessImpactMultiplier: number;
  confidenceFactor: number;
  version: string; // Versioning for auditing (e.g., "BH-v1.0")
}

export interface RewardTierConfig {
  minScore: number;
  maxScore: number;
  rewardMultiplier: number; // 0.5x, 1.0x, 1.5x, 2.0x, etc.
  tierName: string; // 'Critical', 'High', 'Medium', 'Low'
  description: string;
}

export interface OrgPayoutPolicy {
  minScoreToPay: number; // e.g., 4.0 - vulnerabilities below this are auto-rejected
  rewardMultiplierTable: RewardTierConfig[];
  baseRewardPerSubmission?: number; // Base amount to multiply by tier
}

/**
 * Compute the BugHuntr internal severity score
 *
 * @param cvssBase CVSS v3.1 base score (0-10)
 * @param factors Modifiers for exploitability, business impact, and confidence
 * @returns Breakdown of scoring components
 */
export function computeBugHuntrScore(
  cvssBase: number,
  factors: BugHuntrScoringFactors = {}
): BugHuntrScoreBreakdown {
  // Apply defaults
  const em = factors.exploitabilityModifier ?? 1.0;
  const bim = factors.businessImpactMultiplier ?? 1.0;
  const cf = factors.confidenceFactor ?? 0.85;

  // Validate inputs
  if (cvssBase < 0 || cvssBase > 10) {
    throw new Error("CVSS base score must be between 0 and 10");
  }
  if (em < 0.5 || em > 2.0) {
    throw new Error("Exploitability modifier must be between 0.5 and 2.0");
  }
  if (bim < 0.5 || bim > 2.0) {
    throw new Error("Business impact multiplier must be between 0.5 and 2.0");
  }
  if (cf < 0.7 || cf > 1.0) {
    throw new Error("Confidence factor must be between 0.7 and 1.0");
  }

  // Calculate score: clamp to 0-10
  const rawScore = cvssBase * em * bim * cf;
  const clampedScore = Math.max(0, Math.min(10, rawScore));
  const finalScore = Math.round(clampedScore * 10) / 10; // Round to 1 decimal

  return {
    score: finalScore,
    cvssBase,
    exploitabilityModifier: em,
    businessImpactMultiplier: bim,
    confidenceFactor: cf,
    version: "BH-v1.0",
  };
}

/**
 * Derive default scoring factors based on organization and asset type
 * This function pulls business context to calibrate multipliers
 */
export function getDefaultScoringFactorsForAsset(
  assetType: string,
  orgAssetImportanceMap?: Record<string, number>
): BugHuntrScoringFactors {
  // Business Impact Multiplier: how important is this asset to the organization?
  // Default map (can be overridden per org config)
  const bimMap = orgAssetImportanceMap || {
    payment_system: 2.0, // Critical
    authentication: 1.8, // Critical
    admin_panel: 1.6, // High
    api_endpoint: 1.4, // High
    user_data: 1.3, // Medium-High
    web_app: 1.2, // Medium
    internal_system: 1.0, // Medium (default)
    public_api: 1.1, // Medium
    documentation: 0.8, // Low
    staging: 0.5, // Low (staging/dev)
  };

  const bim = bimMap[assetType] ?? 1.0;

  return {
    exploitabilityModifier: 1.0, // Default; elevated if public PoC exists
    businessImpactMultiplier: bim,
    confidenceFactor: 0.85, // Default; increases with better PoC
  };
}

/**
 * Increase exploitability modifier if a public or known exploit exists
 * EM ranges from 1.0 (unknown) to 1.2 (widely exploited)
 */
export function adjustForExploitability(
  baseFactors: BugHuntrScoringFactors,
  hasPublicPoC: boolean = false,
  isKnownVulnerability: boolean = false
): BugHuntrScoringFactors {
  let em = baseFactors.exploitabilityModifier ?? 1.0;

  if (isKnownVulnerability) {
    em = Math.min(1.2, em + 0.1); // Known vuln in wild: +0.1
  }
  if (hasPublicPoC) {
    em = Math.min(1.2, em + 0.1); // Public PoC exists: +0.1
  }

  return {
    ...baseFactors,
    exploitabilityModifier: em,
  };
}

/**
 * Adjust confidence factor based on PoC quality
 * CF ranges from 0.7 (low confidence, theoretical) to 1.0 (fully validated)
 */
export function adjustForProofOfConcept(
  baseFactors: BugHuntrScoringFactors,
  pocType?: string
): BugHuntrScoringFactors {
  let cf = baseFactors.confidenceFactor ?? 0.85;

  if (pocType === "full_working_exploit") {
    cf = 1.0; // Fully working, fully exploitable
  } else if (pocType === "partial_poc") {
    cf = 0.9; // Partial proof (e.g., can trigger but limited impact)
  } else if (pocType === "theoretical") {
    cf = 0.7; // Theoretical or indirect evidence
  } else {
    cf = 0.85; // Default or 'evidence provided'
  }

  return {
    ...baseFactors,
    confidenceFactor: cf,
  };
}

/**
 * Default reward tier table for BugHuntr
 * Map BugHuntr score ranges to reward multipliers
 *
 * Example: If base reward for hunt is $100:
 * - Score 9.0-10: 2.0x = $200
 * - Score 7.0-8.9: 1.5x = $150
 * - Score 4.0-6.9: 1.0x = $100
 * - Score <4.0: auto-rejected (no payout)
 */
export const DEFAULT_REWARD_TIER_TABLE: RewardTierConfig[] = [
  {
    minScore: 9.0,
    maxScore: 10.0,
    rewardMultiplier: 2.0,
    tierName: "CRITICAL",
    description:
      "Critical severity - immediate payout, public disclosure priority",
  },
  {
    minScore: 7.0,
    maxScore: 8.99,
    rewardMultiplier: 1.5,
    tierName: "HIGH",
    description: "High severity - elevated reward",
  },
  {
    minScore: 4.0,
    maxScore: 6.99,
    rewardMultiplier: 1.0,
    tierName: "MEDIUM",
    description: "Medium severity - standard reward",
  },
  {
    minScore: 0.1,
    maxScore: 3.99,
    rewardMultiplier: 0.25,
    tierName: "LOW",
    description:
      "Low severity - reduced reward (often auto-rejected by policy)",
  },
  {
    minScore: 0,
    maxScore: 0,
    rewardMultiplier: 0,
    tierName: "NONE",
    description: "No impact - no reward",
  },
];

/**
 * Map a BugHuntr score to its reward tier
 * Returns tier config or null if no matching tier
 */
export function mapScoreToRewardTier(
  bughuntrScore: number,
  rewardTable: RewardTierConfig[] = DEFAULT_REWARD_TIER_TABLE
): RewardTierConfig | null {
  // Find matching tier (tiers should be sorted by minScore descending)
  const sorted = [...rewardTable].sort((a, b) => b.minScore - a.minScore);
  for (const tier of sorted) {
    if (bughuntrScore >= tier.minScore && bughuntrScore <= tier.maxScore) {
      return tier;
    }
  }
  return null;
}

/**
 * Compute reward amount based on score and org policy
 * @param bughuntrScore Final BugHuntr score (0-10)
 * @param policy Organization payout policy (contains baseReward and reward table)
 * @returns Computed reward in cents or null if auto-rejected
 */
export function computeRewardAmount(
  bughuntrScore: number,
  policy: OrgPayoutPolicy
): { rewardCents: number; tier: RewardTierConfig } | null {
  // Check auto-rejection threshold
  if (bughuntrScore < policy.minScoreToPay) {
    return null; // Auto-rejected due to low severity
  }

  const tier = mapScoreToRewardTier(
    bughuntrScore,
    policy.rewardMultiplierTable
  );
  if (!tier) {
    return null; // No matching tier
  }

  // Base reward: default 10000 cents ($100) if not specified
  const baseReward = policy.baseRewardPerSubmission ?? 10000;
  const rewardCents = Math.round(baseReward * tier.rewardMultiplier);

  return { rewardCents, tier };
}

/**
 * Generate human-readable explanation of scoring
 */
export function explainScore(breakdown: BugHuntrScoreBreakdown): string {
  const lines: string[] = [
    `BugHuntr Severity Score: ${breakdown.score} / 10.0`,
    ``,
    `Calculation:`,
    `  CVSS Base Score:              ${breakdown.cvssBase}`,
    `  × Exploitability Modifier:    ${breakdown.exploitabilityModifier} (PoC status)`,
    `  × Business Impact Multiplier: ${breakdown.businessImpactMultiplier} (asset importance)`,
    `  × Confidence Factor:          ${breakdown.confidenceFactor} (proof quality)`,
    `  ─────────────────────────────────────────────`,
    `  = Final Score (clamped):      ${breakdown.score}`,
    ``,
    `Version: ${breakdown.version}`,
  ];

  return lines.join("\n");
}
