"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-context"
import { useRanking } from "@/hooks/use-ranking"
import { updateUserStats } from "@/lib/update-user-stats"
import { SEVERITY_POINTS } from "@/types/ranking"
import { useRouter } from "next/navigation"
import { Bug, Trophy, AlertTriangle, Star, Upload } from "lucide-react"
import { FadeIn } from "@/components/animations/fade-in"
import { db } from "@/firebaseConfig"
import { collection, addDoc, Timestamp } from "firebase/firestore"

// ☁ Cloudinary Configuration
// TODO: Replace with your actual Cloudinary credentials
const CLOUD_NAME = "dv4jmmzkh"          // Replace with your Cloudinary cloud name
const UPLOAD_PRESET = "unsigned_upload"   // Replace with your unsigned preset

// Alternative: Use a simple base64 upload for testing
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

interface BugSubmission {
  title: string
  company: string
  category: string
  severity: "critical" | "high" | "medium" | "low" | ""
  summary: string
  description: string
  pocFile: File | null
}

export default function SubmitBugPage() {
  const { user } = useAuth()
  const { addPoints } = useRanking()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detectingSeverity, setDetectingSeverity] = useState(false)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string>("")

  const [formData, setFormData] = useState<BugSubmission>({
    title: "",
    company: "",
    category: "",
    severity: "",
    summary: "",
    description: "",
    pocFile: null,
  })

  const handleInputChange = (field: keyof BugSubmission, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }))
  }

  // Call backend for severity detection
  const detectSeverity = async () => {
    if (!formData.title || !formData.description) {
      alert("Please fill in Title and Technical Description before detecting severity.")
      return
    }
    try {
      setDetectingSeverity(true)
      const response = await fetch("https://bughuntr.onrender.com/api/analyzeSeverity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      if (data.severity) {
        setFormData((prev) => ({ ...prev, severity: data.severity.toLowerCase() as BugSubmission["severity"] }))
      } else {
        alert("Failed to detect severity. Please try again.")
      }
    } catch (err) {
      console.error("Error detecting severity:", err)
      alert("Error connecting to severity detection service.")
    } finally {
      setDetectingSeverity(false)
    }
  }

  // ☁ Upload Proof of Concept to Cloudinary (with base64 fallback)
  const handleFileUpload = async () => {
    if (!formData.pocFile) {
      alert("Please select an image or video first!")
      return
    }

    console.log("Starting file upload...")
    console.log("File:", formData.pocFile)
    setUploadingProof(true)

    try {
      // Try Cloudinary first
      const formDataUpload = new FormData()
      formDataUpload.append("file", formData.pocFile)
      formDataUpload.append("upload_preset", UPLOAD_PRESET)

      console.log("Uploading to:", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`)
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formDataUpload,
      })

      console.log("Upload response status:", response.status)
      const data = await response.json()
      console.log("Upload response data:", data)
      
      if (data.secure_url) {
        setUploadedUrl(data.secure_url)
        console.log("Cloudinary upload successful! URL:", data.secure_url)
        alert("✅ Proof uploaded successfully!")
      } else {
        throw new Error("Cloudinary upload failed")
      }
    } catch (err) {
      console.error("Cloudinary upload failed, trying base64 fallback:", err)
      
      try {
        // Fallback to base64 for testing
        const base64 = await convertToBase64(formData.pocFile)
        setUploadedUrl(base64)
        console.log("Base64 upload successful!")
        alert("✅ Proof uploaded successfully! (Using base64 fallback)")
      } catch (base64Error) {
        console.error("Base64 conversion failed:", base64Error)
        alert("❌ Upload failed. Please try again.")
      }
    } finally {
      setUploadingProof(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)

    try {
      const bugData = {
        title: formData.title,
        company: formData.company,
        category: formData.category || "General",
        severity: formData.severity,
        description: formData.description,
        impact: formData.summary,
        proofOfConceptUrl: uploadedUrl || "",
        submittedBy: user.id,
        submittedAt: Timestamp.now().toDate().toISOString(),
        status: "pending",
      }
      
      console.log("Submitting bug data:", bugData)
      console.log("Uploaded URL:", uploadedUrl)
      
      // Add bug to Firestore
      const bugDocRef = await addDoc(collection(db, "bugs"), bugData)

      // Add points based on severity
      if (formData.severity) {
        const severity = formData.severity as "critical" | "high" | "medium" | "low"
        const points = SEVERITY_POINTS[severity]
        
        console.log(`Submitting bug with severity: ${severity}, points: ${points}, user: ${user.username}`)
        
        // Update local ranking state
        addPoints(user.id, Date.now(), severity, `Bug report: ${formData.title} (${severity} severity)`)
        
        // Update points and bug count in Firestore userProfiles
        const statsUpdated = await updateUserStats(user.username, points, 1, user.role, user.companyName)
        
        if (statsUpdated) {
          console.log("Stats updated successfully")
        } else {
          console.error("Failed to update stats")
        }
        
        // Also add bug submission to user's submission history
        await addDoc(collection(db, "bugSubmissions"), {
          bugId: bugDocRef.id,
          userId: user.id,
          username: user.username,
          title: formData.title,
          severity: formData.severity,
          points: points,
          proofOfConceptUrl: uploadedUrl || "",
          submittedAt: Timestamp.now().toDate().toISOString(),
          status: "pending",
          huntId: "", // Direct submission, not from a hunt
          huntTitle: "Direct Submission",
          description: formData.description,
          impact: formData.summary,
        })
        
        console.log("Bug submission saved to both collections")
        alert(`Bug submitted successfully! You earned ${points} points. Your submission is now under review.`)
      } else {
        alert("Bug submitted successfully! Your submission is now under review.")
      }

      router.push("/my-submissions")
    } catch (error) {
      console.error("Error submitting bug:", error)
      alert("Error submitting bug report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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
                      {formData.severity && (
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={getSeverityColor(formData.severity)}>
                            {formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Technical Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Detailed technical analysis..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={6}
                        required
                      />
                    </div>

                    {/* ☁ Proof of Concept Upload */}
                    <div className="space-y-2 pt-4">
                      <Label>Proof of Concept (Image/Video) <span className="text-muted-foreground">(Optional)</span></Label>
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => handleInputChange("pocFile", e.target.files?.[0] || null)}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 flex items-center gap-2"
                        onClick={handleFileUpload}
                        disabled={uploadingProof || !formData.pocFile}
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingProof ? "Uploading..." : "Upload Proof"}
                      </Button>

                      {uploadedUrl && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-2">Uploaded Proof:</p>
                          {formData.pocFile?.type.startsWith("image/") ? (
                            <img src={uploadedUrl} alt="Proof" className="w-48 rounded-md shadow-md" />
                          ) : (
                            <video src={uploadedUrl} controls className="w-48 rounded-md shadow-md" />
                          )}
                        </div>
                      )}
                    </div>

                    {!formData.severity ? (
                      <Button
                        type="button"
                        variant="default"
                        className="w-full bg-cyber-blue hover:bg-cyber-blue/90"
                        disabled={detectingSeverity}
                        onClick={detectSeverity}
                      >
                        {detectingSeverity ? "Detecting..." : "Detect Severity"}
                      </Button>
                    ) : (
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting Report..." : "Submit Vulnerability Report"}
                      </Button>
                    )}
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
                    <span className="font-bold text-cyber-blue">
                      {formData.severity ? SEVERITY_POINTS[formData.severity] : "-"}
                    </span>
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
                          {formData.severity
                            ? SEVERITY_POINTS[formData.severity] * getPointsMultiplier(formData.severity)
                            : "-"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Final points awarded after review</p>
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
