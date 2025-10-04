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
import { useBugHunt } from "@/hooks/use-bug-hunt"
import { SEVERITY_POINTS } from "@/types/ranking"
import { useRouter } from "next/navigation"
import { Bug, Trophy, Star } from "lucide-react"
import { FadeIn } from "@/components/animations/fade-in"
import { db } from "@/firebaseConfig"
import { collection, addDoc, Timestamp } from "firebase/firestore"

// 🧩 Cloudinary Configuration
const CLOUD_NAME = "dv4jmmzkh"           // <-- replace this
const UPLOAD_PRESET = "unsigned_upload"        // <-- replace this

interface BugSubmission {
  title: string
  company: string
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
    severity: "",
    summary: "",
    description: "",
    pocFile: null,
  })

  const { getActiveBugHunts } = useBugHunt()
  const activeBugHunts = getActiveBugHunts()

  // Handle Input Changes
  const handleInputChange = (field: keyof BugSubmission, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }))
  }

  // 📸 Upload Proof to Cloudinary
  const handleFileUpload = async () => {
    if (!formData.pocFile) {
      alert("Please select an image or video first!")
      return
    }

    setUploadingProof(true)

    const formDataUpload = new FormData()
    formDataUpload.append("file", formData.pocFile)
    formDataUpload.append("upload_preset", UPLOAD_PRESET)

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formDataUpload,
      })

      const data = await response.json()
      if (data.secure_url) {
        setUploadedUrl(data.secure_url)
        alert("Proof uploaded successfully!")
      } else {
        alert("Upload failed. Please try again.")
      }
    } catch (err) {
      console.error("Error uploading file:", err)
      alert("Error uploading proof. Please try again.")
    } finally {
      setUploadingProof(false)
    }
  }

  // 🚀 Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)

    try {
      const bugData = {
        title: formData.title,
        company: formData.company,
        severity: formData.severity,
        summary: formData.summary,
        description: formData.description,
        proofOfConceptUrl: uploadedUrl || "",
        submittedBy: user.id,
        submittedAt: Timestamp.now().toDate().toISOString(),
        status: "pending",
      }

      const bugDocRef = await addDoc(collection(db, "bugs"), bugData)

      if (formData.severity) {
        const severity = formData.severity
        const points = SEVERITY_POINTS[severity]
<<<<<<< HEAD

        addPoints(user.id, Date.now(), severity, `Bug report: ${formData.title}`)
        await updateUserStats(user.username, points, 1)

        alert(`Bug submitted successfully! You earned ${points} points.`)
=======
        
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
          submittedAt: Timestamp.now().toDate().toISOString(),
          status: "pending",
          huntId: selectedHunt,
          huntTitle: availableHuntsForSubmission.find((h) => h.id === selectedHunt)?.title || "Unknown Hunt",
        })
        
        alert(`Bug submitted successfully! You earned ${points} points. Your submission is now under review.`)
>>>>>>> 0de2a3ee8257a652b3fcb0c124cb01914b20d6ec
      } else {
        alert("Bug submitted successfully!")
      }

      router.push("/my-submissions")
    } catch (error) {
      console.error("Error submitting bug:", error)
      alert("Error submitting bug report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-5xl">
        <FadeIn>
          <h1 className="text-3xl font-bold mb-6">Submit Vulnerability Report</h1>
        </FadeIn>

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
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Target Company *</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Executive Summary *</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => handleInputChange("summary", e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label>Technical Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={5}
                  required
                />
              </div>

              {/* 📸 Proof of Concept File Upload */}
              <div className="space-y-2">
                <Label>Proof of Concept (Image/Video) *</Label>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleInputChange("pocFile", e.target.files?.[0] || null)}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={handleFileUpload}
                  disabled={uploadingProof || !formData.pocFile}
                >
                  {uploadingProof ? "Uploading..." : "Upload Proof"}
                </Button>

                {uploadedUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Uploaded Proof:</p>
                    {formData.pocFile?.type.startsWith("image/") ? (
                      <img
                        src={uploadedUrl}
                        alt="Proof of concept"
                        className="w-48 rounded-md shadow-md"
                      />
                    ) : (
                      <video
                        src={uploadedUrl}
                        controls
                        className="w-48 rounded-md shadow-md"
                      />
                    )}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !uploadedUrl}>
                {isSubmitting ? "Submitting..." : "Submit Vulnerability Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
