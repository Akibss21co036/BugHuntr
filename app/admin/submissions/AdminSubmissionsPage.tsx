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
import { useBugHunt } from "@/hooks/use-bug-hunt"
import { useAuth } from "@/components/auth/auth-context"
import type { BugHuntSubmission } from "@/types/bug-hunt"

export default function AdminSubmissionsPage() {
  const { user } = useAuth()
  const { bugHunts, submissions, reviewSubmission } = useBugHunt()
  const [selectedSubmission, setSelectedSubmission] = useState<BugHuntSubmission | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [huntFilter, setHuntFilter] = useState("all")
  const [adminNotes, setAdminNotes] = useState("")
  const [pointsToAward, setPointsToAward] = useState("")

  // Filter bug hunts and submissions
  const myBugHunts = useMemo(() => (user ? bugHunts.filter((hunt) => hunt.createdBy === user.id) : []), [bugHunts, user])
  const mySubmissions = useMemo(() => {
    const myHuntIds = myBugHunts.map((hunt) => hunt.id)
    return submissions.filter((submission) => myHuntIds.includes(submission.huntId))
  }, [submissions, myBugHunts])

  const stats = useMemo(() => ({
      total: mySubmissions.length,
      pending: mySubmissions.filter((s) => s.status === "pending").length,
      approved: mySubmissions.filter((s) => s.status === "approved").length,
      rejected: mySubmissions.filter((s) => s.status === "rejected").length,
      duplicate: mySubmissions.filter((s) => s.status === "duplicate").length,
  }), [mySubmissions])

  const uniqueHunts = useMemo(() => myBugHunts.map((hunt) => ({ id: hunt.id, title: hunt.title })), [myBugHunts])

  const handleReviewSubmission = async (action: "approve" | "reject") => {
    if (!selectedSubmission) return
    await reviewSubmission(
      selectedSubmission.id,
      action === "approve" ? "approved" : "rejected",
      adminNotes,
      action === "approve" ? Number.parseInt(pointsToAward) || 0 : undefined,
      "admin"
    )
    setAdminNotes("")
    setPointsToAward("")
    setSelectedSubmission(null)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-500 border-red-500/20"
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "low": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "approved": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "rejected": return "bg-red-500/10 text-red-500 border-red-500/20"
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />
      case "approved": return <CheckCircle className="h-4 w-4" />
      case "rejected": return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const filteredSubmissions = useMemo(() => mySubmissions.filter((submission) => {
      const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            submission.username.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || submission.status === statusFilter
      const matchesSeverity = severityFilter === "all" || submission.severity === severityFilter
      const matchesHunt = huntFilter === "all" || submission.huntId === huntFilter
      return matchesSearch && matchesStatus && matchesSeverity && matchesHunt
  }), [mySubmissions, searchTerm, statusFilter, severityFilter, huntFilter])

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
              <p className="text-muted-foreground mt-1">Review private bug submissions from researchers</p>
            </div>
            <Badge className="bg-orange-600 text-white">Admin Panel</Badge>
          </div>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={0.2}>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search submissions or researchers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={huntFilter} onValueChange={setHuntFilter}>
                  <SelectTrigger className="w-full md:w-60"><SelectValue placeholder="Bug Hunt" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hunts</SelectItem>
                    {uniqueHunts.map((hunt) => (
                      <SelectItem key={hunt.id} value={hunt.id}>{hunt.title}</SelectItem>
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
                <motion.div key={submission.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }}>
                  <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-cyber-blue/30">
                    <CardContent className="p-6 flex justify-between items-start gap-4">
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
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                        <Eye className="h-4 w-4 mr-2" /> Review
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </FadeIn>
      </div>

      {/* Review Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyber-blue" /> Review Submission: {selectedSubmission?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Submission Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Researcher:</strong> {selectedSubmission.username}</div>
                    <div><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
                    <div className="flex items-center gap-2">
                      <strong>Severity:</strong>
                      <Badge className={getSeverityColor(selectedSubmission.severity)}>{selectedSubmission.severity}</Badge>
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
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm bg-muted p-3 rounded">{selectedSubmission.description}</p>
              </div>

              {/* Proof of Concept */}
            <div>
  <h4 className="font-medium mb-2">Proof of Concept</h4>
  {selectedSubmission?.proofOfConcept ? (
    <div className="space-y-2">
      {selectedSubmission.proofOfConcept.endsWith(".mp4") || selectedSubmission.proofOfConcept.endsWith(".webm") ? (
        <video
          src={selectedSubmission.proofOfConcept}
          controls
          className="w-full max-h-80 rounded"
        />
      ) : (
        <img
          src={selectedSubmission.proofOfConcept}
          alt="Proof of Concept"
          className="w-full max-h-80 object-contain rounded border"
        />
      )}
      <a
        href={selectedSubmission.proofOfConcept}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyber-blue text-sm underline"
      >
        Open in new tab
      </a>
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">No proof uploaded.</p>
  )}
</div>


              {/* Review Actions */}
              {selectedSubmission.status === "pending" && (
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Review Actions</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Admin Notes</label>
                      <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes..." rows={3} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Points to Award</label>
                      <Input type="number" value={pointsToAward} onChange={(e) => setPointsToAward(e.target.value)} placeholder="Enter points" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleReviewSubmission("approve")} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve
                      </Button>
                      <Button onClick={() => handleReviewSubmission("reject")} variant="destructive">
                        <XCircle className="h-4 w-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
