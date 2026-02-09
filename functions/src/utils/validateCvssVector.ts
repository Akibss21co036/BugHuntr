/**
 * CVSS Vector Validation Utilities
 *
 * Helper functions for validating CVSS vectors and extracting metadata
 */

import {
  validateVectorString,
  parseVectorString,
  CvssVector,
} from "../cvss/cvssEngine";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    vector?: CvssVector;
    message?: string;
  };
}

/**
 * Comprehensive validation of CVSS vector with detailed feedback
 */
export function validateCvssVector(vectorString: string): ValidationResult {
  // Check if empty
  if (!vectorString || vectorString.trim().length === 0) {
    return {
      valid: false,
      error: "CVSS vector cannot be empty",
    };
  }

  // Check basic format
  if (!vectorString.includes("/")) {
    return {
      valid: false,
      error: 'Invalid CVSS format. Expected "CVSS:3.1/AV:X/AC:X/..."',
    };
  }

  // Validate using engine
  const result = validateVectorString(vectorString);
  if (!result.valid) {
    return {
      valid: false,
      error: result.error || "Validation failed",
    };
  }

  // Parse to extract details
  const vector = parseVectorString(vectorString);
  if (!vector) {
    return {
      valid: false,
      error: "Could not parse CVSS vector",
    };
  }

  return {
    valid: true,
    details: {
      vector,
      message: "CVSS vector is valid and well-formed",
    },
  };
}

/**
 * Check if triager made significant changes to vector
 * Returns true if metrics with highest weight (C, I, A) were changed
 */
export function isSignificantChange(
  oldVector: CvssVector,
  newVector: CvssVector
): boolean {
  // High-impact metrics that require audit attention
  const significantMetrics: (keyof CvssVector)[] = ["C", "I", "A", "AV"];

  for (const metric of significantMetrics) {
    if (oldVector[metric] !== newVector[metric]) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a diff summary between two CVSS vectors
 */
export interface VectorDiff {
  metric: string;
  oldValue: string;
  newValue: string;
  description: string;
}

export function diffVectors(
  oldVector: CvssVector,
  newVector: CvssVector
): VectorDiff[] {
  const diffs: VectorDiff[] = [];
  const metricDescriptions: Record<string, Record<string, string>> = {
    AV: {
      N: "Network (accessible remotely)",
      A: "Adjacent Network (local network)",
      L: "Local (local system access)",
      P: "Physical (physical access required)",
    },
    AC: {
      L: "Low (easily exploitable)",
      H: "High (hard to exploit)",
    },
    PR: {
      N: "None (no privileges required)",
      L: "Low (low privileges required)",
      H: "High (high privileges required)",
    },
    UI: {
      N: "None (no user interaction)",
      R: "Required (user interaction required)",
    },
    S: {
      U: "Unchanged (no scope change)",
      C: "Changed (scope changes)",
    },
    C: {
      N: "None (no confidentiality impact)",
      L: "Low (partial info leak)",
      H: "High (complete info leak)",
    },
    I: {
      N: "None (no integrity impact)",
      L: "Low (limited modification)",
      H: "High (complete modification)",
    },
    A: {
      N: "None (no availability impact)",
      L: "Low (partial unavailability)",
      H: "High (complete unavailability)",
    },
  };

  for (const metric of Object.keys(newVector)) {
    const key = metric as keyof CvssVector;
    const oldValue = (oldVector as any)[key] as string;
    const newVal = (newVector as any)[key] as string;
    if (oldValue !== newVal) {
      diffs.push({
        metric,
        oldValue,
        newValue: newVal,
        description: `${metric}: ${
          metricDescriptions[metric]?.[oldValue] || oldValue
        } → ${metricDescriptions[metric]?.[newVal] || newVal}`,
      });
    }
  }

  return diffs;
}

/**
 * Extract summary of vector characteristics for human review
 */
export interface VectorSummary {
  attackVector: string;
  complexity: string;
  privileges: string;
  userInteraction: string;
  scope: string;
  confidentiality: string;
  integrity: string;
  availability: string;
  overallImpact: string;
}

export function summarizeVector(vector: CvssVector): VectorSummary {
  const descriptions: Record<string, Record<string, string>> = {
    AV: {
      N: "Network (remote)",
      A: "Adjacent Network",
      L: "Local",
      P: "Physical",
    },
    AC: {
      L: "Low complexity",
      H: "High complexity",
    },
    PR: {
      N: "No privileges",
      L: "Low privileges",
      H: "High privileges",
    },
    UI: {
      N: "No user interaction",
      R: "Requires user interaction",
    },
    S: {
      U: "Unchanged scope",
      C: "Changed scope",
    },
    C: {
      N: "No impact",
      L: "Low impact",
      H: "High impact",
    },
    I: {
      N: "No impact",
      L: "Low impact",
      H: "High impact",
    },
    A: {
      N: "No impact",
      L: "Low impact",
      H: "High impact",
    },
  };

  // Determine overall impact
  const impacts = [vector.C, vector.I, vector.A];
  let overallImpact = "None";
  if (impacts.includes("H")) {
    overallImpact =
      "High (confidentiality, integrity, or availability completely compromised)";
  } else if (impacts.includes("L")) {
    overallImpact =
      "Low (limited impact on confidentiality, integrity, or availability)";
  }

  return {
    attackVector: descriptions.AV[vector.AV] || vector.AV,
    complexity: descriptions.AC[vector.AC] || vector.AC,
    privileges: descriptions.PR[vector.PR] || vector.PR,
    userInteraction: descriptions.UI[vector.UI] || vector.UI,
    scope: descriptions.S[vector.S] || vector.S,
    confidentiality: descriptions.C[vector.C] || vector.C,
    integrity: descriptions.I[vector.I] || vector.I,
    availability: descriptions.A[vector.A] || vector.A,
    overallImpact,
  };
}
