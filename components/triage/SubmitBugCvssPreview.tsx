"use client";

/**
 * Submit Bug - CVSS Preview Component
 *
 * Shown on the bug submission form to give hunters a preview of
 * estimated CVSS severity and reward tier (non-authoritative).
 *
 * Helps hunters understand severity before submitting.
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, AlertCircle, TrendingUp } from "lucide-react";

interface SubmitBugCvssPreviewProps {
  vulnerabilityType?: string;
  authenticatedRequired?: boolean;
  userInteractionRequired?: boolean;
  hasPublicPoC?: boolean;
  affectedAssetType?: string;
}

interface ScoringData {
  cvssBase: number;
  bughuntrScore: number;
  severity: string;
  estimatedRewardTier: string;
  estimatedRewardMultiplier: number;
}

export function SubmitBugCvssPreview({
  vulnerabilityType,
  authenticatedRequired,
  userInteractionRequired,
  hasPublicPoC,
  affectedAssetType,
}: SubmitBugCvssPreviewProps) {
  const [scoring, setScoring] = useState<ScoringData | null>(null);
  const [loading, setLoading] = useState(false);

  // TODO: Implement client-side heuristic or call Cloud Function
  // For now, mock data based on inputs
  useEffect(() => {
    if (!vulnerabilityType) {
      setScoring(null);
      return;
    }

    setLoading(true);

    // Simple heuristic (should call actual Cloud Function in production)
    let cvssBase = 5.0;
    let multiplier = 1.0;

    if (
      vulnerabilityType.includes("RCE") ||
      vulnerabilityType.includes("EXEC")
    ) {
      cvssBase = 9.5;
      multiplier = 2.0;
    } else if (vulnerabilityType.includes("SQL")) {
      cvssBase = 8.5;
      multiplier = 1.5;
    } else if (vulnerabilityType.includes("AUTH")) {
      cvssBase = 8.0;
      multiplier = 1.5;
    } else if (vulnerabilityType.includes("XSS")) {
      cvssBase = 7.0;
      multiplier = 1.0;
    } else if (vulnerabilityType.includes("CSRF")) {
      cvssBase = 6.0;
      multiplier = 1.0;
    }

    // Adjust for asset type
    let bim = 1.2;
    if (affectedAssetType === "payment_system") bim = 2.0;
    else if (affectedAssetType === "authentication") bim = 1.8;
    else if (affectedAssetType === "internal_system") bim = 0.8;

    // Adjust for PoC
    let cf = 0.85;
    if (hasPublicPoC) cf = 0.95;

    const bughuntrScore = Math.min(10, cvssBase * 1.1 * bim * cf);

    let severity = "NONE";
    if (bughuntrScore >= 9) severity = "CRITICAL";
    else if (bughuntrScore >= 7) severity = "HIGH";
    else if (bughuntrScore >= 4) severity = "MEDIUM";
    else if (bughuntrScore > 0) severity = "LOW";

    setScoring({
      cvssBase,
      bughuntrScore,
      severity,
      estimatedRewardTier: severity,
      estimatedRewardMultiplier: multiplier,
    });

    setLoading(false);
  }, [
    vulnerabilityType,
    authenticatedRequired,
    userInteractionRequired,
    hasPublicPoC,
    affectedAssetType,
  ]);

  if (!scoring) {
    return null;
  }

  const getSeverityColor = () => {
    if (scoring.bughuntrScore >= 9)
      return "bg-secondary border-border text-foreground";
    if (scoring.bughuntrScore >= 7)
      return "bg-secondary border-border text-foreground";
    if (scoring.bughuntrScore >= 4)
      return "bg-secondary border-border text-foreground";
    return "bg-secondary border-border text-foreground";
  };

  const getSeverityBadge = () => {
    if (scoring.bughuntrScore >= 9)
      return (
        <Badge variant="destructive" className="text-lg px-3 py-1">
          CRITICAL
        </Badge>
      );
    if (scoring.bughuntrScore >= 7)
      return (
        <Badge variant="secondary" className="text-lg px-3 py-1">
          HIGH
        </Badge>
      );
    if (scoring.bughuntrScore >= 4)
      return <Badge className="text-lg px-3 py-1">MEDIUM</Badge>;
    return (
      <Badge variant="outline" className="text-lg px-3 py-1">
        LOW
      </Badge>
    );
  };

  return (
    <Card className={`border-2 ${getSeverityColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Estimated Severity
        </CardTitle>
        <CardDescription>
          This is an automated estimate. Final severity will be determined by
          our triage team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">
              CVSS Base
            </div>
            <div className="text-3xl font-bold mt-1">
              {scoring.cvssBase.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">
              BugHuntr Score
            </div>
            <div className="text-3xl font-bold mt-1">
              {scoring.bughuntrScore.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white bg-opacity-50 px-4 py-3 rounded">
          <span className="text-sm font-semibold">Severity Rating</span>
          {getSeverityBadge()}
        </div>

        {scoring.bughuntrScore >= 4 && (
          <Alert className="bg-white bg-opacity-50">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              This vulnerability appears to qualify for a reward of
              approximately{" "}
              <strong>
                ${(100 * scoring.estimatedRewardMultiplier).toFixed(0)} (est.)
              </strong>
              .
            </AlertDescription>
          </Alert>
        )}

        {scoring.bughuntrScore < 4 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Low severity vulnerabilities may not qualify for a reward under
              our policy, but will still be reviewed by our security team.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-600 space-y-1">
          <p>
            <strong>Note:</strong> This is an automated estimate based on the
            vulnerability type and asset. Final severity and reward decisions
            are made by our triage team after manual review of your submission
            and proof of concept.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
