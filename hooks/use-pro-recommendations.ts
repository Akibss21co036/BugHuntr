"use client";

import { useState } from "react";
import { type ProRecommendation } from "@/types/pro";
import { mockHunterProfiles } from "@/data/mock-pro-data";
import { calculateHunterScore, generateReasonTags } from "@/lib/pro-utils";

export function useProRecommendations() {
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async (
    huntId: string,
    minRank: string,
    minHunts: number,
    requiredCerts: string[],
    maxRecommendations: number = 10
  ): Promise<ProRecommendation[]> => {
    setLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Filter eligible hunters
    const eligibleHunters = mockHunterProfiles.filter((hunter) => {
      const rankScores: Record<string, number> = {
        S: 100,
        A: 75,
        B: 50,
        C: 25,
      };
      const hunterRankScore = rankScores[hunter.rank] || 0;
      const minRankScore = rankScores[minRank] || 0;

      return (
        hunterRankScore >= minRankScore && hunter.huntsParticipated >= minHunts
      );
    });

    // Score and rank hunters
    const recommendations: ProRecommendation[] = eligibleHunters.map(
      (hunter) => {
        const score = calculateHunterScore(
          hunter.rank,
          hunter.reputation,
          hunter.huntsParticipated,
          hunter.successRate,
          hunter.certifications,
          requiredCerts
        );

        const reasonTags = generateReasonTags(
          hunter.rank,
          hunter.reputation,
          hunter.huntsParticipated,
          hunter.successRate,
          hunter.certifications,
          requiredCerts
        );

        return {
          hunterId: hunter.id,
          hunterName: hunter.username,
          score,
          rank: hunter.rank,
          reputation: hunter.reputation,
          huntsParticipated: hunter.huntsParticipated,
          successRate: hunter.successRate,
          certifications: hunter.certifications,
          reasonTags,
          matchPercentage: Math.round(score),
        };
      }
    );

    // Sort by score descending and limit
    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations);

    setLoading(false);
    return sortedRecommendations;
  };

  return {
    generateRecommendations,
    loading,
  };
}
