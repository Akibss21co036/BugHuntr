"use client";

/**
 * CVSS Implementation Demo
 *
 * Interactive demonstration of the complete CVSS v3.1 + CVE workflow:
 * 1. CVSS Vector Generation & Parsing
 * 2. Base Score Calculation
 * 3. BugHuntr Score with Multipliers
 * 4. CVE Request Flow
 * 5. Reward Tier Mapping
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Calculator,
  Shield,
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Zap,
  Info,
  Award,
  ExternalLink,
} from "lucide-react";

// CVSS Vector Interface
interface CvssVector {
  AV: "N" | "A" | "L" | "P";
  AC: "L" | "H";
  PR: "N" | "L" | "H";
  UI: "N" | "R";
  S: "U" | "C";
  C: "H" | "L" | "N";
  I: "H" | "L" | "N";
  A: "H" | "L" | "N";
}

// Demo vulnerability examples
const demoVulnerabilities = [
  {
    id: "DEMO-001",
    title: "SQL Injection in Login Form",
    type: "SQL Injection",
    vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    baseScore: 10.0,
    severity: "CRITICAL",
    description:
      "Unauthenticated SQL injection allowing complete database compromise",
  },
  {
    id: "DEMO-002",
    title: "XSS in User Profile",
    type: "Cross-Site Scripting",
    vector: "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N",
    baseScore: 5.4,
    severity: "MEDIUM",
    description: "Stored XSS requiring low privileges and user interaction",
  },
  {
    id: "DEMO-003",
    title: "Remote Code Execution",
    type: "RCE",
    vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    baseScore: 9.8,
    severity: "CRITICAL",
    description: "Unauthenticated RCE via file upload vulnerability",
  },
  {
    id: "DEMO-004",
    title: "Information Disclosure",
    type: "Information Exposure",
    vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
    baseScore: 5.3,
    severity: "MEDIUM",
    description: "Exposed API endpoint leaking user email addresses",
  },
  {
    id: "DEMO-005",
    title: "CSRF on Account Settings",
    type: "CSRF",
    vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N",
    baseScore: 6.5,
    severity: "MEDIUM",
    description: "Cross-site request forgery allowing account modification",
  },
];

// Metric descriptions
const metricDescriptions = {
  AV: {
    N: "Network - Remotely exploitable",
    A: "Adjacent - Local network required",
    L: "Local - Local access required",
    P: "Physical - Physical access required",
  },
  AC: {
    L: "Low - No specialized conditions",
    H: "High - Requires specific conditions",
  },
  PR: {
    N: "None - No authentication required",
    L: "Low - Basic user privileges",
    H: "High - Admin privileges required",
  },
  UI: {
    N: "None - No user interaction",
    R: "Required - Requires user action",
  },
  S: {
    U: "Unchanged - Same authorization scope",
    C: "Changed - Breaks authorization boundary",
  },
  C: {
    H: "High - Total confidentiality loss",
    L: "Low - Some information disclosed",
    N: "None - No confidentiality impact",
  },
  I: {
    H: "High - Total integrity loss",
    L: "Low - Limited modification possible",
    N: "None - No integrity impact",
  },
  A: {
    H: "High - Total availability loss",
    L: "Low - Reduced performance",
    N: "None - No availability impact",
  },
};

export default function CvssDemoPage() {
  const [selectedVector, setSelectedVector] = useState<CvssVector>({
    AV: "N",
    AC: "L",
    PR: "N",
    UI: "N",
    S: "U",
    C: "H",
    I: "H",
    A: "H",
  });

  const [vectorString, setVectorString] = useState("");
  const [baseScore, setBaseScore] = useState(0);
  const [severity, setSeverity] = useState("NONE");
  const [bugHuntrScore, setBugHuntrScore] = useState(0);
  const [rewardTier, setRewardTier] = useState("");
  const [estimatedReward, setEstimatedReward] = useState(0);

  // Business impact multiplier
  const [assetType, setAssetType] = useState("web_app");
  const [businessMultiplier, setBusinessMultiplier] = useState(1.0);
  const [hasPoC, setHasPoC] = useState(true);
  const [exploitability, setExploitability] = useState(1.0);

  // Calculate CVSS base score
  const calculateBaseScore = (vector: CvssVector): number => {
    const impact = calculateImpact(vector);
    const exploitability = calculateExploitability(vector);

    if (impact <= 0) return 0;

    const scopeChanged = vector.S === "C";
    let baseScore: number;

    if (scopeChanged) {
      baseScore = Math.min(1.08 * (impact + exploitability), 10);
    } else {
      baseScore = Math.min(impact + exploitability, 10);
    }

    return Math.round(baseScore * 10) / 10;
  };

  const calculateImpact = (vector: CvssVector): number => {
    const impactValues = { H: 0.56, L: 0.22, N: 0 };
    const C = impactValues[vector.C];
    const I = impactValues[vector.I];
    const A = impactValues[vector.A];

    const isc = 1 - (1 - C) * (1 - I) * (1 - A);

    if (vector.S === "U") {
      return 6.42 * isc;
    } else {
      return 7.52 * (isc - 0.029) - 3.25 * Math.pow(isc - 0.02, 15);
    }
  };

  const calculateExploitability = (vector: CvssVector): number => {
    const avValues = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
    const acValues = { L: 0.77, H: 0.44 };
    const prValues = {
      N: { U: 0.85, C: 0.85 },
      L: { U: 0.62, C: 0.68 },
      H: { U: 0.27, C: 0.5 },
    };
    const uiValues = { N: 0.85, R: 0.62 };

    const av = avValues[vector.AV];
    const ac = acValues[vector.AC];
    const pr = prValues[vector.PR][vector.S];
    const ui = uiValues[vector.UI];

    return 8.22 * av * ac * pr * ui;
  };

  const getSeverityRating = (score: number): string => {
    if (score === 0) return "NONE";
    if (score < 4.0) return "LOW";
    if (score < 7.0) return "MEDIUM";
    if (score < 9.0) return "HIGH";
    return "CRITICAL";
  };

  const calculateBugHuntrScore = (
    cvssBase: number,
    assetMultiplier: number,
    exploitMod: number
  ): number => {
    const pocBonus = hasPoC ? 1.1 : 1.0;
    const score = cvssBase * assetMultiplier * exploitMod * pocBonus;
    return Math.round(score * 10) / 10;
  };

  const getRewardTier = (score: number): string => {
    if (score >= 9.0) return "CRITICAL";
    if (score >= 7.0) return "HIGH";
    if (score >= 4.0) return "MEDIUM";
    if (score >= 1.0) return "LOW";
    return "INFO";
  };

  const estimateReward = (tier: string): number => {
    const rewardRanges: Record<string, number> = {
      CRITICAL: 5000,
      HIGH: 2500,
      MEDIUM: 1000,
      LOW: 500,
      INFO: 100,
    };
    return rewardRanges[tier] || 0;
  };

  // Update calculations when vector changes
  useEffect(() => {
    const base = calculateBaseScore(selectedVector);
    setBaseScore(base);
    setSeverity(getSeverityRating(base));

    const vectorStr = `CVSS:3.1/AV:${selectedVector.AV}/AC:${selectedVector.AC}/PR:${selectedVector.PR}/UI:${selectedVector.UI}/S:${selectedVector.S}/C:${selectedVector.C}/I:${selectedVector.I}/A:${selectedVector.A}`;
    setVectorString(vectorStr);

    // Asset type multipliers
    const assetMultipliers: Record<string, number> = {
      payment_system: 2.0,
      authentication: 1.8,
      web_app: 1.0,
      api: 1.2,
      documentation: 0.5,
    };
    const assetMult = assetMultipliers[assetType] || 1.0;
    setBusinessMultiplier(assetMult);

    const bhScore = calculateBugHuntrScore(base, assetMult, exploitability);
    setBugHuntrScore(bhScore);

    const tier = getRewardTier(bhScore);
    setRewardTier(tier);
    setEstimatedReward(estimateReward(tier));
  }, [selectedVector, assetType, hasPoC, exploitability]);

  const loadDemoVuln = (vuln: (typeof demoVulnerabilities)[0]) => {
    const parts = vuln.vector.replace("CVSS:3.1/", "").split("/");
    const newVector: Partial<CvssVector> = {};

    parts.forEach((part) => {
      const [key, value] = part.split(":");
      (newVector as any)[key] = value;
    });

    setSelectedVector(newVector as CvssVector);
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-600";
      case "HIGH":
        return "bg-orange-600";
      case "MEDIUM":
        return "bg-yellow-600";
      case "LOW":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-10 w-10 text-blue-600" />
          <div>
            <h1 className="text-4xl font-bold">
              CVSS v3.1 Implementation Demo
            </h1>
            <p className="text-muted-foreground mt-1">
              Interactive demonstration of BugHuntr's CVSS scoring + CVE
              workflow system
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>About This Demo</AlertTitle>
          <AlertDescription>
            This demo showcases the complete CVSS v3.1 implementation including
            vector parsing, base score calculation, BugHuntr scoring with
            business multipliers, and reward tier mapping. All calculations
            follow the official NIST SP 800-126 specification.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator">
            <Calculator className="h-4 w-4 mr-2" />
            Vector Calculator
          </TabsTrigger>
          <TabsTrigger value="examples">
            <FileText className="h-4 w-4 mr-2" />
            Example Vulnerabilities
          </TabsTrigger>
          <TabsTrigger value="scoring">
            <TrendingUp className="h-4 w-4 mr-2" />
            Scoring Breakdown
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <DollarSign className="h-4 w-4 mr-2" />
            Reward Mapping
          </TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vector Builder */}
            <Card>
              <CardHeader>
                <CardTitle>CVSS Vector Builder</CardTitle>
                <CardDescription>
                  Configure CVSS v3.1 base metrics to generate a vector
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Attack Vector */}
                <div className="space-y-2">
                  <Label>Attack Vector (AV)</Label>
                  <Select
                    value={selectedVector.AV}
                    onValueChange={(v) =>
                      setSelectedVector({ ...selectedVector, AV: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">
                        Network - {metricDescriptions.AV.N}
                      </SelectItem>
                      <SelectItem value="A">
                        Adjacent - {metricDescriptions.AV.A}
                      </SelectItem>
                      <SelectItem value="L">
                        Local - {metricDescriptions.AV.L}
                      </SelectItem>
                      <SelectItem value="P">
                        Physical - {metricDescriptions.AV.P}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Attack Complexity */}
                <div className="space-y-2">
                  <Label>Attack Complexity (AC)</Label>
                  <Select
                    value={selectedVector.AC}
                    onValueChange={(v) =>
                      setSelectedVector({ ...selectedVector, AC: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">
                        Low - {metricDescriptions.AC.L}
                      </SelectItem>
                      <SelectItem value="H">
                        High - {metricDescriptions.AC.H}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Privileges Required */}
                <div className="space-y-2">
                  <Label>Privileges Required (PR)</Label>
                  <Select
                    value={selectedVector.PR}
                    onValueChange={(v) =>
                      setSelectedVector({ ...selectedVector, PR: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">
                        None - {metricDescriptions.PR.N}
                      </SelectItem>
                      <SelectItem value="L">
                        Low - {metricDescriptions.PR.L}
                      </SelectItem>
                      <SelectItem value="H">
                        High - {metricDescriptions.PR.H}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Interaction */}
                <div className="space-y-2">
                  <Label>User Interaction (UI)</Label>
                  <Select
                    value={selectedVector.UI}
                    onValueChange={(v) =>
                      setSelectedVector({ ...selectedVector, UI: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">
                        None - {metricDescriptions.UI.N}
                      </SelectItem>
                      <SelectItem value="R">
                        Required - {metricDescriptions.UI.R}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Scope */}
                <div className="space-y-2">
                  <Label>Scope (S)</Label>
                  <Select
                    value={selectedVector.S}
                    onValueChange={(v) =>
                      setSelectedVector({ ...selectedVector, S: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="U">
                        Unchanged - {metricDescriptions.S.U}
                      </SelectItem>
                      <SelectItem value="C">
                        Changed - {metricDescriptions.S.C}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Impact Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Confidentiality */}
                  <div className="space-y-2">
                    <Label className="text-xs">Confidentiality (C)</Label>
                    <Select
                      value={selectedVector.C}
                      onValueChange={(v) =>
                        setSelectedVector({ ...selectedVector, C: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="H">High</SelectItem>
                        <SelectItem value="L">Low</SelectItem>
                        <SelectItem value="N">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Integrity */}
                  <div className="space-y-2">
                    <Label className="text-xs">Integrity (I)</Label>
                    <Select
                      value={selectedVector.I}
                      onValueChange={(v) =>
                        setSelectedVector({ ...selectedVector, I: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="H">High</SelectItem>
                        <SelectItem value="L">Low</SelectItem>
                        <SelectItem value="N">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Availability */}
                  <div className="space-y-2">
                    <Label className="text-xs">Availability (A)</Label>
                    <Select
                      value={selectedVector.A}
                      onValueChange={(v) =>
                        setSelectedVector({ ...selectedVector, A: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="H">High</SelectItem>
                        <SelectItem value="L">Low</SelectItem>
                        <SelectItem value="N">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              {/* CVSS Score */}
              <Card>
                <CardHeader>
                  <CardTitle>CVSS Base Score</CardTitle>
                  <CardDescription>
                    Official NIST CVSS v3.1 calculation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-bold">
                      {baseScore.toFixed(1)}
                    </div>
                    <Badge
                      className={`${getSeverityColor(
                        severity
                      )} text-white text-lg px-4 py-1`}
                    >
                      {severity}
                    </Badge>
                    <div className="pt-4 border-t">
                      <Label className="text-sm text-muted-foreground">
                        Vector String
                      </Label>
                      <code className="block mt-2 p-2 bg-muted rounded text-xs break-all">
                        {vectorString}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* BugHuntr Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    BugHuntr Score
                  </CardTitle>
                  <CardDescription>
                    Adjusted score with business multipliers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Asset Type</Label>
                    <Select value={assetType} onValueChange={setAssetType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment_system">
                          Payment System (2.0x)
                        </SelectItem>
                        <SelectItem value="authentication">
                          Authentication (1.8x)
                        </SelectItem>
                        <SelectItem value="api">API (1.2x)</SelectItem>
                        <SelectItem value="web_app">Web App (1.0x)</SelectItem>
                        <SelectItem value="documentation">
                          Documentation (0.5x)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Proof of Concept Available</Label>
                    <Button
                      variant={hasPoC ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHasPoC(!hasPoC)}
                    >
                      {hasPoC ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mr-2" />
                      )}
                      {hasPoC ? "Yes (+10%)" : "No"}
                    </Button>
                  </div>

                  <div className="pt-4 border-t text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {bugHuntrScore.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {baseScore.toFixed(1)} × {businessMultiplier}x ×{" "}
                      {hasPoC ? "1.1x" : "1.0x"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Reward Estimate */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-500" />
                    Estimated Reward
                  </CardTitle>
                  <CardDescription>
                    Based on BugHuntr score tier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <Badge
                      className={`${getSeverityColor(
                        rewardTier
                      )} text-white text-lg px-4 py-1`}
                    >
                      {rewardTier} TIER
                    </Badge>
                    <div className="text-3xl font-bold text-green-600">
                      ${estimatedReward.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Actual rewards may vary based on organization policy
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Example Vulnerabilities</CardTitle>
              <CardDescription>
                Click any example to load it into the calculator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoVulnerabilities.map((vuln) => (
                  <div
                    key={vuln.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => loadDemoVuln(vuln)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{vuln.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vuln.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${getSeverityColor(
                            vuln.severity
                          )} text-white`}
                        >
                          {vuln.baseScore.toFixed(1)}
                        </Badge>
                        <Badge variant="outline">{vuln.severity}</Badge>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{vuln.description}</p>
                    <code className="text-xs bg-muted p-2 rounded block">
                      {vuln.vector}
                    </code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Breakdown Tab */}
        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CVSS Scoring Methodology</CardTitle>
              <CardDescription>
                Understanding how CVSS v3.1 base scores are calculated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Exploitability Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>
                      Attack Vector (AV): <strong>{selectedVector.AV}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      {metricDescriptions.AV[selectedVector.AV]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Attack Complexity (AC):{" "}
                      <strong>{selectedVector.AC}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      {metricDescriptions.AC[selectedVector.AC]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Privileges Required (PR):{" "}
                      <strong>{selectedVector.PR}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      {metricDescriptions.PR[selectedVector.PR]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      User Interaction (UI):{" "}
                      <strong>{selectedVector.UI}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      {metricDescriptions.UI[selectedVector.UI]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Impact Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>
                      Scope (S): <strong>{selectedVector.S}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      {metricDescriptions.S[selectedVector.S]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Confidentiality (C): <strong>{selectedVector.C}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      {metricDescriptions.C[selectedVector.C]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Integrity (I): <strong>{selectedVector.I}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      {metricDescriptions.I[selectedVector.I]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Availability (A): <strong>{selectedVector.A}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      {metricDescriptions.A[selectedVector.A]}
                    </span>
                  </div>
                </div>
              </div>

              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertTitle>Formula</AlertTitle>
                <AlertDescription className="font-mono text-xs mt-2">
                  {selectedVector.S === "C"
                    ? "Score = MIN(1.08 × (Impact + Exploitability), 10.0)"
                    : "Score = MIN(Impact + Exploitability, 10.0)"}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>BugHuntr Scoring System</CardTitle>
              <CardDescription>
                How we adjust CVSS scores for business context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Business Impact Multipliers</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Payment System</span>
                    <Badge>2.0x</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Authentication</span>
                    <Badge>1.8x</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>API</span>
                    <Badge>1.2x</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Web App</span>
                    <Badge>1.0x</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Documentation</span>
                    <Badge>0.5x</Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Additional Factors</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Proof of Concept: +10% bonus
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Exploitability: Variable (0.8x - 1.2x)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Public Disclosure: Time-based reduction
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reward Tier Mapping</CardTitle>
                <CardDescription>
                  How BugHuntr scores map to reward tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      tier: "CRITICAL",
                      range: "9.0 - 10.0",
                      reward: "$5,000+",
                      color: "bg-red-600",
                    },
                    {
                      tier: "HIGH",
                      range: "7.0 - 8.9",
                      reward: "$2,500+",
                      color: "bg-orange-600",
                    },
                    {
                      tier: "MEDIUM",
                      range: "4.0 - 6.9",
                      reward: "$1,000+",
                      color: "bg-yellow-600",
                    },
                    {
                      tier: "LOW",
                      range: "1.0 - 3.9",
                      reward: "$500+",
                      color: "bg-blue-600",
                    },
                    {
                      tier: "INFO",
                      range: "0.1 - 0.9",
                      reward: "$100+",
                      color: "bg-gray-600",
                    },
                  ].map((item) => (
                    <div
                      key={item.tier}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={`${item.color} text-white`}>
                          {item.tier}
                        </Badge>
                        <span className="text-sm font-mono">{item.range}</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        {item.reward}
                      </span>
                    </div>
                  ))}
                </div>

                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Rewards are estimated baselines. Organizations may set
                    custom policies with different multipliers and ranges.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CVE Assignment Criteria</CardTitle>
                <CardDescription>
                  When vulnerabilities qualify for CVE IDs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Eligible for CVE
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• CVSS Base Score ≥ 7.0 (High/Critical)</li>
                    <li>• Affects publicly available software</li>
                    <li>• Acknowledged by vendor</li>
                    <li>• Patch available or in progress</li>
                    <li>• Meets CVE Program scope requirements</li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">CVE Request Process</h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <span className="font-semibold">1.</span>
                      <span>Triager approves CVSS score</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold">2.</span>
                      <span>Admin reviews eligibility criteria</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold">3.</span>
                      <span>Request submitted to CVE Program</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold">4.</span>
                      <span>CVE ID assigned and published</span>
                    </li>
                  </ol>
                </div>

                <div className="border-t pt-4">
                  <Button className="w-full" variant="outline" asChild>
                    <a
                      href="/admin/cve-requests"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View CVE Requests Dashboard
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold mb-1">CVSS v3.1 Compliant</h3>
              <p className="text-xs text-muted-foreground">
                Follows NIST SP 800-126 Rev. 3 specification
              </p>
            </div>
            <div>
              <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <h3 className="font-semibold mb-1">Real-time Calculations</h3>
              <p className="text-xs text-muted-foreground">
                Instant scoring with business context multipliers
              </p>
            </div>
            <div>
              <Award className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold mb-1">Automated Rewards</h3>
              <p className="text-xs text-muted-foreground">
                Tier-based reward estimation with payout tracking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
