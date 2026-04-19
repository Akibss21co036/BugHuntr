"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/animations/fade-in";
import { useBugHunt } from "@/hooks/use-bug-hunt";
import { useAuth } from "@/components/auth/auth-context";
import type { BugHuntSubmission } from "@/types/bug-hunt";
import { formatCurrency } from "@/lib/pro-utils";

export default function AdminSubmissionsPage() {
  const { user } = useAuth();
  const { bugHunts, submissions, reviewSubmission } = useBugHunt();
  const [selectedSubmission, setSelectedSubmission] =
    useState<BugHuntSubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [huntFilter, setHuntFilter] = useState("all");
  const [adminNotes, setAdminNotes] = useState("");

  // Filter bug hunts and submissions
  // Company admins should only see submissions for their company's bug hunts
  const myBugHunts = useMemo(() => {
    if (!user) return [];
    // Filter by company - admins only see their company's hunts
    if (user.userType === "company" && user.companyName) {
      return bugHunts.filter((hunt) => hunt.company === user.companyName);
    }
    // Regular users only see their own bug hunts
    return bugHunts.filter((hunt) => hunt.createdBy === user.id);
  }, [bugHunts, user]);

  const mySubmissions = useMemo(() => {
    if (!user) return [];
    const myHuntIds = myBugHunts.map((hunt) => hunt.id);
    // Filter submissions to only those for the company's bug hunts
    return submissions.filter((submission) =>
      myHuntIds.includes(submission.huntId)
    );
  }, [submissions, myBugHunts, user]);

  const stats = useMemo(
    () => ({
      total: mySubmissions.length,
      pending: mySubmissions.filter((s) => s.status === "pending").length,
      approved: mySubmissions.filter((s) => s.status === "approved").length,
      rejected: mySubmissions.filter((s) => s.status === "rejected").length,
      duplicate: mySubmissions.filter((s) => s.status === "duplicate").length,
    }),
    [mySubmissions]
  );

  const uniqueHunts = useMemo(
    () => myBugHunts.map((hunt) => ({ id: hunt.id, title: hunt.title })),
    [myBugHunts]
  );

  const getHuntForSubmission = (huntId: string) => {
    return myBugHunts.find((hunt) => hunt.id === huntId);
  };

  const getRewardAmount = (submission: BugHuntSubmission) => {
    const hunt = getHuntForSubmission(submission.huntId);
    if (!hunt?.rewards) return 0;
    const severity = submission.severity as keyof typeof hunt.rewards;
    return hunt.rewards[severity] || 0;
  };

  const handleReviewSubmission = async (action: "approve" | "reject") => {
    if (!selectedSubmission) return;
    const rewardAmount = getRewardAmount(selectedSubmission);
    try {
      await reviewSubmission(
        selectedSubmission.id,
        action === "approve" ? "approved" : "rejected",
        adminNotes,
        action === "approve" ? rewardAmount : undefined,
        user?.username || "admin"
      );
      setAdminNotes("");
      setSelectedSubmission(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to approve submission. Please try again.";
      alert(message);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-[color:color-mix(in_srgb,var(--critical)_12%,transparent)] text-[var(--critical)] border-[color:color-mix(in_srgb,var(--critical)_25%,transparent)]";
      case "high":
        return "bg-[color:color-mix(in_srgb,var(--high)_12%,transparent)] text-[var(--high)] border-[color:color-mix(in_srgb,var(--high)_25%,transparent)]";
      case "medium":
        return "bg-[color:color-mix(in_srgb,var(--medium)_12%,transparent)] text-[var(--medium)] border-[color:color-mix(in_srgb,var(--medium)_25%,transparent)]";
      case "low":
        return "bg-[var(--accent-soft)] text-primary border-[var(--border-light)]";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[color:color-mix(in_srgb,var(--medium)_12%,transparent)] text-[var(--medium)] border-[color:color-mix(in_srgb,var(--medium)_25%,transparent)]";
      case "approved":
        return "bg-[color:color-mix(in_srgb,var(--low)_12%,transparent)] text-[var(--low)] border-[color:color-mix(in_srgb,var(--low)_25%,transparent)]";
      case "rejected":
        return "bg-[color:color-mix(in_srgb,var(--critical)_12%,transparent)] text-[var(--critical)] border-[color:color-mix(in_srgb,var(--critical)_25%,transparent)]";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredSubmissions = useMemo(
    () =>
      mySubmissions.filter((submission) => {
        const matchesSearch =
          submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || submission.status === statusFilter;
        const matchesSeverity =
          severityFilter === "all" || submission.severity === severityFilter;
        const matchesHunt =
          huntFilter === "all" || submission.huntId === huntFilter;
        return matchesSearch && matchesStatus && matchesSeverity && matchesHunt;
      }),
    [mySubmissions, searchTerm, statusFilter, severityFilter, huntFilter]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Submission Review Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Review bug submissions from researchers
              </p>
            </div>
            <Badge className="bg-[var(--high)] text-white">Admin Panel</Badge>
          </div>
        </FadeIn>

        {/* Stats Cards */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-[var(--medium)]">
                      {stats.pending}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-[var(--medium)] opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold text-[var(--low)]">
                      {stats.approved}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-[var(--low)] opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-2xl font-bold text-[var(--critical)]">
                      {stats.rejected}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-[var(--critical)] opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Duplicate</p>
                    <p className="text-2xl font-bold text-gray-500">
                      {stats.duplicate}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-gray-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
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
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={severityFilter}
                  onValueChange={setSeverityFilter}
                >
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
            {filteredSubmissions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">
                    No Submissions Found
                  </h3>
                  <p className="text-muted-foreground">
                    {mySubmissions.length === 0
                      ? "There are no submissions to review yet."
                      : "No submissions match your current filters. Try adjusting your search criteria."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {filteredSubmissions.map((submission, index) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-[var(--border-light)]">
                      <CardContent className="p-6 flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg truncate">
                              {submission.title}
                            </h3>
                            <Badge
                              className={getSeverityColor(submission.severity)}
                            >
                              {submission.severity}
                            </Badge>
                            <Badge
                              className={getStatusColor(submission.status)}
                            >
                              {getStatusIcon(submission.status)}
                              <span className="ml-1 capitalize">
                                {submission.status.replace("-", " ")}
                              </span>
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                            {submission.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {submission.username}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(
                                submission.submittedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> Review
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Review Modal */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={() => setSelectedSubmission(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Review Submission:{" "}
              {selectedSubmission?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Submission Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Researcher:</strong> {selectedSubmission.username}
                    </div>
                    <div>
                      <strong>Submitted:</strong>{" "}
                      {new Date(
                        selectedSubmission.submittedAt
                      ).toLocaleString()}
                    </div>
                    {getHuntForSubmission(selectedSubmission.huntId) && (
                      <>
                        <div>
                          <strong>Bug Hunt:</strong>{" "}
                          {
                            getHuntForSubmission(selectedSubmission.huntId)
                              ?.title
                          }
                        </div>
                        <div>
                          <strong>Company:</strong>{" "}
                          {
                            getHuntForSubmission(selectedSubmission.huntId)
                              ?.company
                          }
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <strong>Severity:</strong>
                      <Badge
                        className={getSeverityColor(
                          selectedSubmission.severity
                        )}
                      >
                        {selectedSubmission.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Status:</strong>
                      <Badge
                        className={getStatusColor(selectedSubmission.status)}
                      >
                        {getStatusIcon(selectedSubmission.status)}
                        <span className="ml-1 capitalize">
                          {selectedSubmission.status.replace("-", " ")}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm bg-muted p-3 rounded">
                  {selectedSubmission.description}
                </p>
              </div>

              {/* Proof of Concept */}
              <div>
                <h4 className="font-medium mb-2">Proof of Concept</h4>
                {selectedSubmission?.proofOfConcept ? (
                  <div className="space-y-2">
                    {selectedSubmission.proofOfConcept.endsWith(".mp4") ||
                    selectedSubmission.proofOfConcept.endsWith(".webm") ? (
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
                      className="text-primary text-sm underline"
                    >
                      Open in new tab
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No proof uploaded.
                  </p>
                )}
              </div>

              {/* Review Actions */}
              {selectedSubmission.status === "pending" && (
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Review Actions</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Admin Notes</label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Reward Amount
                      </label>
                      <Input
                        type="text"
                        value={formatCurrency(getRewardAmount(selectedSubmission))}
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Amount is set automatically based on severity.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReviewSubmission("approve")}
                        className="bg-[var(--low)] hover:bg-[color:color-mix(in_srgb,var(--low)_85%,black)]"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve
                      </Button>
                      <Button
                        onClick={() => handleReviewSubmission("reject")}
                        variant="destructive"
                      >
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
  );
}
