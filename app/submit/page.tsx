"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-context"
import { useRanking } from "@/hooks/use-ranking"
import { useBugHunt } from "@/hooks/use-bug-hunt"
import { useUserHunts } from "@/hooks/use-user-hunts"
import { SEVERITY_POINTS } from "@/types/ranking"
import { useRouter } from "next/navigation"
import { Bug, Trophy, AlertTriangle, Star, Target, Calendar, Users, Award } from "lucide-react"
import { FadeIn } from "@/components/animations/fade-in"
import { db } from "@/firebaseConfig"
import { collection, addDoc, Timestamp } from "firebase/firestore"

interface BugSubmission {
  title: string
  company: string
  category: string
  severity: "critical" | "high" | "medium" | "low"
  summary: string
  description: string
  poc: string
}

export default function SubmitBugPage() {
  const { user } = useAuth()
  const { addPoints } = useRanking()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedHunt, setSelectedHunt] = useState<string>("")
  const [formData, setFormData] = useState<BugSubmission>({
    title: "",
    company: "",
    category: "",
    severity: "medium",
    summary: "",
    description: "",
    poc: "",
  })
  const { getActiveBugHunts } = useBugHunt()
  const activeBugHunts = getActiveBugHunts()
  const availableHuntsForSubmission = activeBugHunts

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;
    try {
      // Save submission to Firestore
      const bugData = {
  email: user.email || "",
    title: formData.title,
    huntId: selectedHunt,
    huntTitle: availableHuntsForSubmission.find(h => h.id === selectedHunt)?.title || "Unknown Hunt",
    stepsToReproduce: formData.poc,
    impact: formData.summary,
    attachments: [],
    submittedBy: user.id,
    postedTime: Timestamp.now().toDate().toISOString(),
    submittedAt: Timestamp.now().toDate().toISOString(),
    status: "pending",
      };
      await addDoc(collection(db, "bugs"), bugData);
      addPoints(user.id, Date.now(), formData.severity, `Bug report: ${formData.title} (${formData.severity} severity)`);
      alert(`Bug submitted successfully! You earned ${SEVERITY_POINTS[formData.severity]} points. Your submission is now under review.`);
      router.push("/feed");
    } catch (error) {
      console.error("Error submitting bug:", error);
      alert("Error submitting bug report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BugSubmission, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-severity-critical/10 text-severity-critical border-severity-critical/20"
      case "high":
        return "bg-severity-high/10 text-severity-high border-severity-high/20"
      case "medium":
        return "bg-severity-medium/10 text-severity-medium border-severity-medium/20"
      case "low":
        return "bg-severity-low/10 text-severity-low border-severity-low/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getPointsMultiplier = (severity: string) => {
    const multipliers = { critical: 4, high: 3, medium: 2, low: 1 }
    return multipliers[severity as keyof typeof multipliers] || 1
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Submit Vulnerability Report</h1>
            <p className="text-muted-foreground">
              Report a security vulnerability and earn points based on severity level. All submissions are reviewed
              privately by our security team.
            </p>
          </div>
        </FadeIn>

  {/* Removed Active Bug Hunts section and join logic */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FadeIn delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="w-5 h-5 text-cyber-blue" />
                    Vulnerability Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter vulnerability title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        required
                      />
                    </div>
                    {/* Always show bug hunt selection, no join required */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Vulnerability Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g., SQL Injection in Login Form"
                          value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Target Organization *</Label>
                        <Input
                          id="company"
                          placeholder="e.g., TechCorp"
                          value={formData.company}
                          onChange={(e) => handleInputChange("company", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Vulnerability Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => handleInputChange("category", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Web Application">Web Application</SelectItem>
                            <SelectItem value="API Security">API Security</SelectItem>
                            <SelectItem value="Mobile Application">Mobile Application</SelectItem>
                            <SelectItem value="Network Security">Network Security</SelectItem>
                            <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                            <SelectItem value="Social Engineering">Social Engineering</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="severity">Risk Severity *</Label>
                        <Select
                          value={formData.severity}
                          onValueChange={(value) => handleInputChange("severity", value as BugSubmission["severity"])}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="summary">Executive Summary *</Label>
                      <Textarea
                        id="summary"
                        placeholder="Brief overview of the vulnerability and its potential impact..."
                        value={formData.summary}
                        onChange={(e) => handleInputChange("summary", e.target.value)}
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Technical Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Detailed technical analysis including affected components, attack vectors, and potential business impact..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={6}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="poc">Proof of Concept *</Label>
                      <Textarea
                        id="poc"
                        placeholder="Step-by-step reproduction instructions, code snippets, screenshots, or video demonstrations..."
                        value={formData.poc}
                        onChange={(e) => handleInputChange("poc", e.target.value)}
                        rows={6}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || availableHuntsForSubmission.length === 0}
                    >
                      {isSubmitting ? "Submitting Report..." : "Submit Vulnerability Report"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          <div className="space-y-6">
            <FadeIn delay={0.3}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-cyber-blue" />
                    Points Reward
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Risk Level</span>
                    <Badge className={getSeverityColor(formData.severity)}>{formData.severity}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Base Points</span>
                    <span className="font-bold text-cyber-blue">{SEVERITY_POINTS[formData.severity]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Multiplier</span>
                    <span className="font-bold text-neon-green">{getPointsMultiplier(formData.severity)}x</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Potential</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-neon-orange" />
                        <span className="font-bold text-lg text-neon-orange">
                          {SEVERITY_POINTS[formData.severity] * getPointsMultiplier(formData.severity)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Final points awarded after review</p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.4}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-neon-orange" />
                    Submission Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="p-3 bg-cyber-blue/5 border border-cyber-blue/20 rounded-lg">
                    <p className="text-cyber-blue font-medium text-xs mb-1">PRIVACY NOTICE</p>
                    <p className="text-xs">
                      Your submission will be kept private and only visible to authorized security reviewers.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyber-blue rounded-full mt-2 flex-shrink-0" />
                    <span>Ensure vulnerability is reproducible with clear evidence</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyber-blue rounded-full mt-2 flex-shrink-0" />
                    <span>Include detailed technical analysis and business impact</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyber-blue rounded-full mt-2 flex-shrink-0" />
                    <span>Follow responsible disclosure and ethical testing practices</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyber-blue rounded-full mt-2 flex-shrink-0" />
                    <span>Submissions undergo thorough security review process</span>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  )
}
