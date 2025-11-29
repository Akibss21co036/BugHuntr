"use client";

import { type HunterEligibility } from "@/types/pro";
import { checkEligibility } from "@/lib/pro-utils";

export function useProEligibility() {
  const checkHunterEligibility = (
    rank: string,
    huntsParticipated: number,
    certifications: string[],
    minRank: string = "B",
    minHunts: number = 25,
    requiredCerts: string[] = []
  ): HunterEligibility => {
    return checkEligibility(
      rank,
      huntsParticipated,
      certifications,
      minRank,
      minHunts,
      requiredCerts
    );
  };

  return {
    checkHunterEligibility,
  };
}
