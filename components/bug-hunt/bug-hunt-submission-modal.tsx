"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Upload, Eye, AlertTriangle, CheckCircle, X } from "lucide-react"
import type { BugHunt } from "@/types/bug-hunt"
import { useAuth } from "@/components/auth/auth-context"
import { useBugHunt } from "@/hooks/use-bug-hunt"

interface BugHuntSubmissionModalProps {
  hunt: BugHunt
  isOpen: boolean
  onClose: () => void
}

export function BugHuntSubmissionModal({ hunt, isOpen, onClose }: BugHuntSubmissionModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    severity: "",
    summary: "",
    technicalDescription: "",
    proofOfConcept: "",
    attachments: [] as File[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detectingSeverity, setDetectingSeverity] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { user } = useAuth()
  const { submitToBugHunt } = useBugHunt()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const combinedDescription = formData.summary
        ? `Executive Summary:\n${formData.summary}\n\nTechnical Description:\n${formData.technicalDescription}`
        : formData.technicalDescription

      await submitToBugHunt({
        huntId: hunt.id,
        userId: user?.id || "anonymous",
        username: user?.username || "anonymous",
        title: formData.title,
        description: combinedDescription,
        severity: formData.severity as any,
        category: hunt.categories[0] || "General",
        proofOfConcept: formData.proofOfConcept,
        // stepsToReproduce: formData.stepsToReproduce, // Removed: not in BugHuntSubmission type
        // impact: formData.impact,
        // attachments: formData.attachments.map(f => f.name),
      })
      setIsSubmitting(false)
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          title: "",
          severity: "",
          summary: "",
          technicalDescription: "",
          proofOfConcept: "",
          attachments: [],
        })
        onClose()
      }, 3000)
    } catch (error) {
      setIsSubmitting(false)
      alert("Error submitting bug report. Please try again.")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }))
  }

  const detectSeverity = async () => {
    if (!formData.title || !formData.technicalDescription) {
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
          description: formData.technicalDescription,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      if (data.severity) {
        setFormData((prev) => ({
          ...prev,
          severity: String(data.severity).toLowerCase(),
        }))
      } else {
        alert("Failed to detect severity. Please try again.")
      }
    } catch (error) {
      console.error("Error detecting severity:", error)
      alert("Error connecting to severity detection service.")
    } finally {
      setDetectingSeverity(false)
    }
  }

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Submit Vulnerability Report
          </DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8"
            >
              <CheckCircle className="h-16 w-16 text-[var(--low)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Submission Received!</h3>
              <p className="text-muted-foreground mb-4">
                Your vulnerability report has been submitted privately to the admin team for review.
              </p>
              <Badge className="bg-primary text-white">Status: Pending Review</Badge>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-4">
                <h4 className="font-medium mb-2">Bug Hunt: {hunt.title}</h4>
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    This submission will be private and only visible to administrators for review.
                  </AlertDescription>
                </Alert>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Vulnerability Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., SQL Injection in login form"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Executive Summary *</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                    placeholder="Brief overview of the vulnerability and its potential impact..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="technicalDescription">Technical Description *</Label>
                  <Textarea
                    id="technicalDescription"
                    value={formData.technicalDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, technicalDescription: e.target.value }))}
                    placeholder="Detailed technical analysis..."
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="poc">Proof of Concept</Label>
                  <Textarea
                    id="poc"
                    value={formData.proofOfConcept}
                    onChange={(e) => setFormData((prev) => ({ ...prev, proofOfConcept: e.target.value }))}
                    placeholder="Provide code, screenshots, or other evidence..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="attachments">Attachments</Label>
                  <div className="space-y-2">
                    <Input
                      id="attachments"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.zip"
                    />
                    {formData.attachments.length > 0 && (
                      <div className="space-y-1">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                            <span>{file.name}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please ensure your submission follows responsible disclosure practices and includes sufficient
                    detail for reproduction.
                  </AlertDescription>
                </Alert>

                {formData.severity && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Detected severity:</span>
                    <Badge className="bg-primary text-white">
                      {formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)}
                    </Badge>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                    Cancel
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={detectSeverity}
                    disabled={detectingSeverity}
                  >
                    {detectingSeverity ? "Detecting..." : "Detect Severity"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.severity}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
