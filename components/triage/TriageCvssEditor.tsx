"use client";

/**
 * Triage CVSS Editor Component
 *
 * Allows triagers to review, edit, and approve CVSS vectors.
 * Shows:
 * - Suggested vector (editable via dropdowns)
 * - Live CVSS base score calculation
 * - BugHuntr score with multiplier breakdown
 * - Audit timeline of previous changes
 * - Approval buttons
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Lock,
  Zap,
} from "lucide-react";

interface CvssEditorProps {
  vulnId: string;
  suggestedVector?: string;
  suggestedScore?: number;
  suggestedBughuntrScore?: number;
  currentVector?: string;
  currentScore?: number;
  currentBughuntrScore?: number;
  status: string;
  auditHistory?: any[];
  onApprove: (
    vector: string,
    notes: string,
    finalSignOff: boolean
  ) => Promise<void>;
  isLoading?: boolean;
}

const METRIC_OPTIONS = {
  AV: {
    N: { label: "Network (N)", description: "Remotely exploitable" },
    A: { label: "Adjacent (A)", description: "Local network access required" },
    L: { label: "Local (L)", description: "Local system access required" },
    P: { label: "Physical (P)", description: "Physical access required" },
  },
  AC: {
    L: { label: "Low (L)", description: "No special conditions needed" },
    H: { label: "High (H)", description: "Special conditions required" },
  },
  PR: {
    N: { label: "None (N)", description: "No privileges required" },
    L: { label: "Low (L)", description: "Low-level privileges required" },
    H: { label: "High (H)", description: "Administrative privileges required" },
  },
  UI: {
    N: { label: "None (N)", description: "No user interaction required" },
    R: { label: "Required (R)", description: "User interaction required" },
  },
  S: {
    U: {
      label: "Unchanged (U)",
      description: "Impact limited to affected component",
    },
    C: {
      label: "Changed (C)",
      description: "Impact beyond affected component",
    },
  },
  C: {
    N: { label: "None (N)", description: "No confidentiality impact" },
    L: { label: "Low (L)", description: "Some confidentiality impact" },
    H: { label: "High (H)", description: "Complete confidentiality loss" },
  },
  I: {
    N: { label: "None (N)", description: "No integrity impact" },
    L: { label: "Low (L)", description: "Some integrity impact" },
    H: { label: "High (H)", description: "Complete integrity loss" },
  },
  A: {
    N: { label: "None (N)", description: "No availability impact" },
    L: { label: "Low (L)", description: "Some availability impact" },
    H: { label: "High (H)", description: "Complete availability loss" },
  },
};

export function TriageCvssEditor({
  vulnId,
  suggestedVector,
  suggestedScore,
  suggestedBughuntrScore,
  currentVector,
  currentScore,
  currentBughuntrScore,
  status,
  auditHistory = [],
  onApprove,
  isLoading = false,
}: CvssEditorProps) {
  const [vector, setVector] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [showSignOffModal, setShowSignOffModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Parse vector string to metrics
  useEffect(() => {
    if (suggestedVector) {
      const parts = suggestedVector.split("/");
      const metrics: Record<string, string> = {};
      for (const part of parts) {
        if (part.includes(":")) {
          const [key, val] = part.split(":");
          if (key) metrics[key] = val;
        }
      }
      setVector(metrics);
    }
  }, [suggestedVector]);

  // Handle metric change
  const handleMetricChange = (metric: string, value: string) => {
    setVector((prev) => ({
      ...prev,
      [metric]: value,
    }));
  };

  // Reconstruct vector string
  const vectorString =
    vector && Object.keys(vector).length > 0
      ? `CVSS:3.1/AV:${vector.AV}/AC:${vector.AC}/PR:${vector.PR}/UI:${vector.UI}/S:${vector.S}/C:${vector.C}/I:${vector.I}/A:${vector.A}`
      : "";

  // Handle approval
  const handleApprove = async (finalSignOff: boolean) => {
    try {
      setIsSaving(true);
      await onApprove(vectorString, notes, finalSignOff);
      setShowSignOffModal(false);
      setNotes("");
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score >= 9) return "text-[var(--critical)]";
    if (score >= 7) return "text-[var(--high)]";
    if (score >= 4) return "text-[var(--medium)]";
    return "text-primary";
  };

  const getSeverityBadge = (score?: number) => {
    if (!score) return <Badge>NONE</Badge>;
    if (score >= 9) return <Badge variant="destructive">CRITICAL</Badge>;
    if (score >= 7) return <Badge variant="secondary">HIGH</Badge>;
    if (score >= 4) return <Badge>MEDIUM</Badge>;
    return <Badge variant="outline">LOW</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CVSS Triage Editor</h2>
          <p className="text-sm text-gray-500 mt-1">{vulnId}</p>
        </div>
        <div className="flex gap-2">
          {status === "triaged" && <Lock className="w-5 h-5 text-[var(--low)]" />}
        </div>
      </div>

      {/* Status Alert */}
      {status === "triaged" && (
        <Alert className="bg-[color:color-mix(in_srgb,var(--low)_10%,transparent)] border-[color:color-mix(in_srgb,var(--low)_25%,transparent)]">
          <CheckCircle2 className="h-4 w-4 text-[var(--low)]" />
          <AlertDescription className="text-[var(--low)]">
            This vulnerability has been triaged and locked. Changes require
            admin override.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="editor" className="w-full">
        <TabsList>
          <TabsTrigger value="editor">Vector Editor</TabsTrigger>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="audit">Audit History</TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                CVSS v3.1 Metrics
              </CardTitle>
              <CardDescription>
                Suggested:{" "}
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {suggestedVector}
                </code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Metric Row */}
              {Object.entries(METRIC_OPTIONS).map(([metricKey, options]) => (
                <div
                  key={metricKey}
                  className="border-b last:border-0 pb-6 last:pb-0"
                >
                  <label className="block text-sm font-semibold mb-2">
                    {metricKey}
                  </label>
                  <Select
                    value={vector[metricKey] || ""}
                    onValueChange={(val) => handleMetricChange(metricKey, val)}
                  >
                    <SelectTrigger disabled={status === "triaged"}>
                      <SelectValue placeholder={`Select ${metricKey}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(options).map(
                        ([val, { label, description }]) => (
                          <SelectItem key={val} value={val}>
                            <div>
                              <div className="font-semibold">{label}</div>
                              <div className="text-xs text-gray-500">
                                {description}
                              </div>
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-semibold mb-2">
                  Triager Notes
                </label>
                <Textarea
                  placeholder="Why did you change this vector? Any special considerations?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={status === "triaged"}
                  className="h-32"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end mt-6">
                <Button
                  variant="outline"
                  disabled={status === "triaged" || isSaving}
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={() => setShowSignOffModal(true)}
                  disabled={status === "triaged" || isSaving}
                  className="bg-[var(--low)] hover:bg-[color:color-mix(in_srgb,var(--low)_85%,black)]"
                >
                  {isSaving ? "Saving..." : "Approve & Sign-off"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scores Tab */}
        <TabsContent value="scores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Suggested */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Suggested Scores (Auto)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    CVSS Base Score
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={`text-3xl font-bold ${getSeverityColor(
                        suggestedScore
                      )}`}
                    >
                      {suggestedScore?.toFixed(1)}
                    </span>
                    {getSeverityBadge(suggestedScore)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    BugHuntr Score
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={`text-2xl font-bold ${getSeverityColor(
                        suggestedBughuntrScore
                      )}`}
                    >
                      {suggestedBughuntrScore?.toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current */}
            {currentVector && currentScore && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Current Scores (Approved)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      CVSS Base Score
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span
                        className={`text-3xl font-bold ${getSeverityColor(
                          currentScore
                        )}`}
                      >
                        {currentScore?.toFixed(1)}
                      </span>
                      {getSeverityBadge(currentScore)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      BugHuntr Score
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span
                        className={`text-2xl font-bold ${getSeverityColor(
                          currentBughuntrScore
                        )}`}
                      >
                        {currentBughuntrScore?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">BugHuntr Score Formula</CardTitle>
              <CardDescription>
                BugHuntr Score = CVSS Base × Exploitability × Impact ×
                Confidence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                {suggestedBughuntrScore?.toFixed(1)} ={" "}
                {suggestedScore?.toFixed(1)} × 1.1 × 1.2 × 0.9
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Exploitability Modifier:</span>
                  <code>1.1 (PoC provided)</code>
                </div>
                <div className="flex justify-between">
                  <span>Business Impact Multiplier:</span>
                  <code>1.2 (API endpoint)</code>
                </div>
                <div className="flex justify-between">
                  <span>Confidence Factor:</span>
                  <code>0.9 (Partial PoC)</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit History Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Triage Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditHistory && auditHistory.length > 0 ? (
                <div className="space-y-4">
                  {auditHistory.map((entry, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-gray-200 pl-4 py-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-sm">
                            {entry.action}
                          </div>
                          <div className="text-xs text-gray-500">
                            by {entry.actorUid}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {new Date(entry.timestamp).toLocaleString()}
                        </Badge>
                      </div>
                      {entry.vector && (
                        <div className="mt-2 text-xs bg-gray-50 p-2 rounded font-mono">
                          {entry.vector}
                        </div>
                      )}
                      {entry.notes && (
                        <div className="text-xs text-gray-600 mt-1">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No audit history yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sign-off Modal */}
      {showSignOffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Confirm Triage Sign-off</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-[color:color-mix(in_srgb,var(--medium)_10%,transparent)] border-[color:color-mix(in_srgb,var(--medium)_25%,transparent)]">
                <AlertCircle className="h-4 w-4 text-[var(--medium)]" />
                <AlertDescription className="text-[var(--medium)]">
                  Signing off will lock this CVSS and trigger reward decision.
                  This action is audited.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" disabled />
                  <span className="text-sm">
                    I confirm the CVSS vector is accurate
                  </span>
                </label>
              </div>
            </CardContent>
            <div className="flex gap-3 p-6 border-t justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSignOffModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleApprove(true)}
                disabled={isSaving}
                className="bg-[var(--low)] hover:bg-[color:color-mix(in_srgb,var(--low)_85%,black)]"
              >
                {isSaving ? "Signing off..." : "Confirm Sign-off"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
