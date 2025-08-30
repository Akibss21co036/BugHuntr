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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    description: "",
    stepsToReproduce: "",
    impact: "",
    proofOfConcept: "",
    attachments: [] as File[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { user } = useAuth()
  const { submitToBugHunt } = useBugHunt()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await submitToBugHunt({
        huntId: hunt.id,
        userId: user?.id || "anonymous",
        username: user?.username || "anonymous",
        title: formData.title,
        description: formData.description,
        severity: formData.severity as any,
        category: hunt.categories[0] || "General",
        proofOfConcept: formData.proofOfConcept,
      })
      setIsSubmitting(false)
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          title: "",
          severity: "",
          description: "",
          stepsToReproduce: "",
          impact: "",
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
            <Shield className="h-5 w-5 text-cyber-blue" />
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
              <CheckCircle className="h-16 w-16 text-neon-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Submission Received!</h3>
              <p className="text-muted-foreground mb-4">
                Your vulnerability report has been submitted privately to the admin team for review.
              </p>
              <Badge className="bg-cyber-blue text-white">Status: Pending Review</Badge>
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
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="severity">Severity *</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, severity: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the vulnerability in detail..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="steps">Steps to Reproduce *</Label>
                  <Textarea
                    id="steps"
                    value={formData.stepsToReproduce}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stepsToReproduce: e.target.value }))}
                    placeholder="1. Navigate to...&#10;2. Enter...&#10;3. Click..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="impact">Impact Assessment *</Label>
                  <Textarea
                    id="impact"
                    value={formData.impact}
                    onChange={(e) => setFormData((prev) => ({ ...prev, impact: e.target.value }))}
                    placeholder="Explain the potential impact of this vulnerability..."
                    rows={3}
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

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
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
