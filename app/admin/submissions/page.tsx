"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Award,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { FadeIn } from "@/components/animations/fade-in"
import type { BugSubmission } from "@/types/bug-submission"

// Mock data for submissions
const mockSubmissions: BugSubmission[] = [
  {
    id: "sub-001",
    huntId: "hunt-001",
    huntTitle: "TechCorp Web Application Security Assessment",
    title: "SQL Injection in User Profile Update",
    severity: "critical",
    description:
      "Found SQL injection vulnerability in the user profile update functionality that allows unauthorized database access.",
    stepsToReproduce:
      "1. Navigate to profile settings\n2. Intercept update request\n3. Inject malicious SQL payload\n4. Observe database response",
    impact: "Complete database compromise, user data exposure, potential system takeover",
    proofOfConcept: "Attached screenshots and payload examples demonstrating successful injection",
    attachments: ["screenshot1.png", "payload.txt"],
    submittedBy: "researcher123",
    submittedAt: "2024-01-15T10:30:00Z",
    status: "pending",
  },
  {
    id: "sub-002",
    huntId: "hunt-001",
    huntTitle: "TechCorp Web Application Security Assessment",
    title: "XSS Vulnerability in Comment System",
    severity: "high",
    description: "Stored XSS vulnerability in the comment system allows execution of malicious scripts.",
    stepsToReproduce:
      "1. Post comment with XSS payload\n2. View comment on public page\n3. Script executes in victim's browser",
    impact: "Session hijacking, credential theft, malicious redirects",
    proofOfConcept: "Video demonstration of successful XSS execution",
    attachments: ["xss-demo.mp4"],
    submittedBy: "securitypro",
    submittedAt: "2024-01-14T15:45:00Z",
    status: "under-review",
    adminNotes: "Reviewing impact assessment and reproduction steps",
    reviewedBy: "admin1",
  },
  {
    id: "sub-003",
    huntId: "hunt-002",
    huntTitle: "StartupXYZ API Security Challenge",
    title: "Authentication Bypass in API Endpoint",
    severity: "high",
    description: "API endpoint allows unauthorized access by manipulating JWT tokens.",
    stepsToReproduce:
      "1. Obtain valid JWT token\n2. Modify token payload\n3. Access restricted endpoints\n4. Bypass authentication",
    impact: "Unauthorized access to sensitive user data and admin functions",
    attachments: ["jwt-analysis.pdf"],
    submittedBy: "apihacker",
    submittedAt: "2024-01-13T09:20:00Z",
    status: "approved",
    adminNotes: "Excellent find! Awarded full points for critical security issue.",
    pointsAwarded: 1500,
    reviewedBy: "admin2",
    reviewedAt: "2024-01-14T11:00:00Z",
  },
  {
    id: "sub-004",
    huntId: "hunt-001",
    huntTitle: "TechCorp Web Application Security Assessment",
    title: "Information Disclosure in Error Messages",
    severity: "low",
    description: "Error messages reveal sensitive system information including file paths and database details.",
    stepsToReproduce:
      "1. Trigger application errors\n2. Observe detailed error messages\n3. Extract system information",
    impact: "Information leakage that could aid in further attacks",
    attachments: ["error-screenshots.zip"],
    submittedBy: "bugfinder",
    submittedAt: "2024-01-12T14:10:00Z",
    status: "rejected",
    adminNotes: "This is expected behavior for development environment. Not applicable to production.",
    reviewedBy: "admin1",
    reviewedAt: "2024-01-13T16:30:00Z",
  },
]

export default function AdminSubmissionsPage() {
  const [submissions] = useState<BugSubmission[]>(mockSubmissions)
  const [selectedSubmission, setSelectedSubmission] = useState<BugSubmission | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [huntFilter, setHuntFilter] = useState("all")
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [pointsToAward, setPointsToAward] = useState("")

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesSearch =
        submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || submission.status === statusFilter
      const matchesSeverity = severityFilter === "all" || submission.severity === severityFilter
      const matchesHunt = huntFilter === "all" || submission.huntId === huntFilter

      return matchesSearch && matchesStatus && matchesSeverity && matchesHunt
    })
  }, [submissions, searchTerm, statusFilter, severityFilter, huntFilter])

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter((s) => s.status === "pending").length,
      underReview: submissions.filter((s) => s.status === "under-review").length,
      approved: submissions.filter((s) => s.status === "approved").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    }
  }, [submissions])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "under-review":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "under-review":
        return <Eye className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const handleReviewSubmission = (action: "approve" | "reject") => {
    if (!selectedSubmission) return

    // Here you would typically make an API call to update the submission
    console.log(`${action} submission ${selectedSubmission.id}`, {
      adminNotes,
      pointsAwarded: action === "approve" ? Number.parseInt(pointsToAward) || 0 : 0,
    })

    // Reset form and close modal
    setReviewAction(null)
    setAdminNotes("")
    setPointsToAward("")
    setSelectedSubmission(null)
  }

  const uniqueHunts = Array.from(new Set(submissions.map((s) => ({ id: s.huntId, title: s.huntTitle }))))

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-8 w-8 text-cyber-blue" />
                Submission Review Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Review and manage private bug submissions from security researchers
              </p>
            </div>
            <Badge className="bg-orange-600 text-white">Admin Panel</Badge>
          </div>
        </FadeIn>

        {/* Stats Cards */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyber-blue" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <div className="text-2xl font-bold text-cyber-blue mt-1">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <div className="text-2xl font-bold text-yellow-500 mt-1">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Review</span>
                </div>
                <div className="text-2xl font-bold text-blue-500 mt-1">{stats.underReview}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Approved</span>
                </div>
                <div className="text-2xl font-bold text-green-500 mt-1">{stats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Rejected</span>
                </div>
                <div className="text-2xl font-bold text-red-500 mt-1">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={0.2}>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search submissions or researchers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={huntFilter} onValueChange={setHuntFilter}>
                  <SelectTrigger className="w-full md:w-60">
                    <SelectValue placeholder="Bug Hunt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hunts</SelectItem>
                    {uniqueHunts.map((hunt) => (
                      <SelectItem key={hunt.id} value={hunt.id}>
                        {hunt.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Submissions List */}
        <FadeIn delay={0.3}>
          <div className="space-y-4">
            <AnimatePresence>
              {filteredSubmissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-cyber-blue/30">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg truncate">{submission.title}</h3>
                            <Badge className={getSeverityColor(submission.severity)}>{submission.severity}</Badge>
                            <Badge className={getStatusColor(submission.status)}>
                              {getStatusIcon(submission.status)}
                              <span className="ml-1 capitalize">{submission.status.replace("-", " ")}</span>
                            </Badge>
                          </div>

                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{submission.description}</p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{submission.submittedBy}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{submission.huntTitle}</span>
                            </div>
                            {submission.pointsAwarded && (
                              <div className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                <span>{submission.pointsAwarded} pts</span>
                              </div>
                            )}
                          </div>

                          {submission.adminNotes && (
                            <Alert className="mt-3">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Admin Notes:</strong> {submission.adminNotes}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredSubmissions.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Review Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyber-blue" />
              Review Submission: {selectedSubmission?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Submission Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Researcher:</strong> {selectedSubmission.submittedBy}
                    </div>
                    <div>
                      <strong>Hunt:</strong> {selectedSubmission.huntTitle}
                    </div>
                    <div>
                      <strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Severity:</strong>
                      <Badge className={getSeverityColor(selectedSubmission.severity)}>
                        {selectedSubmission.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Status:</strong>
                      <Badge className={getStatusColor(selectedSubmission.status)}>
                        {getStatusIcon(selectedSubmission.status)}
                        <span className="ml-1 capitalize">{selectedSubmission.status.replace("-", " ")}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Attachments</h4>
                  <div className="space-y-1">
                    {selectedSubmission.attachments.map((file, index) => (
                      <div key={index} className="text-sm bg-muted p-2 rounded">
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm bg-muted p-3 rounded">{selectedSubmission.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Steps to Reproduce</h4>
                <pre className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                  {selectedSubmission.stepsToReproduce}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Impact Assessment</h4>
                <p className="text-sm bg-muted p-3 rounded">{selectedSubmission.impact}</p>
              </div>

              {selectedSubmission.proofOfConcept && (
                <div>
                  <h4 className="font-medium mb-2">Proof of Concept</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedSubmission.proofOfConcept}</p>
                </div>
              )}

              {selectedSubmission.status === "pending" || selectedSubmission.status === "under-review" ? (
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Review Actions</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Admin Notes</label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about your review decision..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Points to Award (if approving)</label>
                      <Input
                        type="number"
                        value={pointsToAward}
                        onChange={(e) => setPointsToAward(e.target.value)}
                        placeholder="Enter points based on severity and impact"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReviewSubmission("approve")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Submission
                      </Button>
                      <Button onClick={() => handleReviewSubmission("reject")} variant="destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Submission
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                selectedSubmission.adminNotes && (
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-2">Previous Review</h4>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Reviewed by:</strong> {selectedSubmission.reviewedBy}
                        <br />
                        <strong>Date:</strong>{" "}
                        {selectedSubmission.reviewedAt
                          ? new Date(selectedSubmission.reviewedAt).toLocaleString()
                          : "N/A"}
                        <br />
                        <strong>Notes:</strong> {selectedSubmission.adminNotes}
                        {selectedSubmission.pointsAwarded && (
                          <>
                            <br />
                            <strong>Points Awarded:</strong> {selectedSubmission.pointsAwarded}
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                )
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
