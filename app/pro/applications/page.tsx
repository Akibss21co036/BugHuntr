"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  ArrowLeft,
  UserCheck,
  Send,
} from "lucide-react";
import { useProApplications } from "@/hooks/use-pro-applications";
import { formatDateRange, getUserPermissions } from "@/lib/pro-utils";
import { useAuth } from "@/components/auth/auth-context";

export default function ProApplicationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { applications, loading } = useProApplications();
  const [activeTab, setActiveTab] = useState("all");

  // Get user permissions
  const permissions = user
    ? getUserPermissions(user.role, user.userType)
    : null;

  const isAdmin = user?.role === "admin";
  const isCompany = Boolean(permissions?.isCompany) || isAdmin;
  const isHunter = Boolean(permissions?.isHunter) && !isAdmin;

  // Filter applications based on user type
  // Hunters see their own applications
  // Companies (and admins) see applications for their hunts
  const relevantApplications = applications.filter((app) => {
    if (isHunter) {
      return app.hunterId === user?.id;
    }
    if (isCompany && user?.userType === "company" && user?.companyName) {
      // Companies see applications for hunts they created (matching their company name)
      return app.companyName === user.companyName;
    }
    return false;
  });

  const handleBackToProDashboard = () => {
    router.push("/pro");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-[var(--low)]" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-[var(--critical)]" />;
      case "pending":
        return <Clock className="w-5 h-5 text-[var(--medium)]" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-[var(--low)]";
      case "rejected":
        return "bg-[var(--critical)]";
      case "pending":
        return "bg-[var(--medium)]";
      case "more_info_requested":
        return "bg-primary";
      default:
        return "bg-gray-600";
    }
  };

  const filteredApplications = relevantApplications.filter((app) => {
    if (activeTab === "all") return true;
    return app.status === activeTab;
  });

  // Handler for company actions on applications
  const handleApproveApplication = (appId: string) => {
    console.log("Approve application:", appId);
    // In production: call API to approve
  };

  const handleRejectApplication = (appId: string) => {
    console.log("Reject application:", appId);
    // In production: call API to reject
  };

  const handleRequestMoreInfo = (appId: string) => {
    console.log("Request more info:", appId);
    // In production: call API to request more info
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--border-light)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#10151c] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={handleBackToProDashboard}
            className="gap-2 text-muted-foreground hover:text-foreground mb-4"
            data-testid="back-to-pro-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pro Dashboard
          </Button>
          <h1 className="text-3xl font-black mb-2">
            {isCompany ? "Review Applications" : "My Pro Applications"}
          </h1>
          <p className="text-gray-400">
            {isCompany
              ? "Manage hunter applications for your Pro hunts"
              : "Track your Pro hunt applications and invitations"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#181e26] border-[#23272f]">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {relevantApplications.length}
              </div>
              <div className="text-sm text-gray-400">
                {isCompany ? "Total Received" : "Total Applications"}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#181e26] border-[#23272f]">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[var(--medium)]">
                {
                  relevantApplications.filter((a) => a.status === "pending")
                    .length
                }
              </div>
              <div className="text-sm text-gray-400">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-[#181e26] border-[#23272f]">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[var(--low)]">
                {
                  relevantApplications.filter((a) => a.status === "approved")
                    .length
                }
              </div>
              <div className="text-sm text-gray-400">Approved</div>
            </CardContent>
          </Card>
          <Card className="bg-[#181e26] border-[#23272f]">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[var(--critical)]">
                {
                  relevantApplications.filter((a) => a.status === "rejected")
                    .length
                }
              </div>
              <div className="text-sm text-gray-400">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#181e26]">
            <TabsTrigger value="all" data-testid="all-tab">
              All ({relevantApplications.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="pending-tab">
              Pending (
              {
                relevantApplications.filter((a) => a.status === "pending")
                  .length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="approved-tab">
              Approved (
              {
                relevantApplications.filter((a) => a.status === "approved")
                  .length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="rejected-tab">
              Rejected (
              {
                relevantApplications.filter((a) => a.status === "rejected")
                  .length
              }
              )
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {filteredApplications.length === 0 ? (
              <Card className="bg-[#181e26] border-[#23272f]">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-bold mb-2">
                    No applications found
                  </h3>
                  <p className="text-gray-400 mb-6">
                    You haven't applied to any Pro hunts yet.
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/pro/hunts")}
                    className="bg-primary hover:bg-[var(--accent-hover)]"
                  >
                    Browse Pro Hunts
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredApplications.map((app) => (
                <Card
                  key={app.id}
                  className="bg-[#181e26] border-[#23272f] hover:border-[var(--border-light)] transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{app.huntTitle}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>
                            ● Submitted{" "}
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </span>
                          {app.bidAmount && (
                            <span>
                              ● Bid: ${app.bidAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(app.status)}>
                        {app.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cover Letter Preview */}
                    <div>
                      <p className="text-sm font-semibold text-gray-400 mb-1">
                        Cover Letter:
                      </p>
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {app.cover}
                      </p>
                    </div>

                    {/* Review Notes */}
                    {app.reviewNotes && (
                      <div className="bg-[var(--accent-soft)] border border-[var(--border-light)] rounded-lg p-4">
                        <p className="text-sm font-semibold text-primary mb-1">
                          Company Response:
                        </p>
                        <p className="text-sm text-gray-300">
                          {app.reviewNotes}
                        </p>
                        {app.reviewedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Reviewed on{" "}
                            {new Date(app.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions - Different for hunters vs companies */}
                    {isHunter && (
                      <>
                        {app.status === "approved" && (
                          <div className="flex gap-2">
                            <Button
                              className="bg-[var(--low)] hover:bg-[color:color-mix(in_srgb,var(--low)_85%,black)]"
                              data-testid="sign-nda-btn"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Sign NDA & Begin
                            </Button>
                            <Button
                              variant="outline"
                              data-testid="view-hunt-details-btn"
                            >
                              View Hunt Details
                            </Button>
                          </div>
                        )}

                        {app.status === "more_info_requested" && (
                          <Button
                            className="bg-primary hover:bg-[var(--accent-hover)]"
                            data-testid="provide-info-btn"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Provide Additional Info
                          </Button>
                        )}
                      </>
                    )}

                    {isCompany && (
                      <>
                        {app.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              className="bg-[var(--low)] hover:bg-[color:color-mix(in_srgb,var(--low)_85%,black)]"
                              onClick={() => handleApproveApplication(app.id)}
                              data-testid={`approve-btn-${app.id}`}
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="border-[var(--border-light)] text-primary hover:bg-[var(--accent-soft)]"
                              onClick={() => handleRequestMoreInfo(app.id)}
                              data-testid={`request-info-btn-${app.id}`}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Request Info
                            </Button>
                            <Button
                              variant="outline"
                              className="border-[color:color-mix(in_srgb,var(--critical)_35%,transparent)] text-[var(--critical)] hover:bg-[color:color-mix(in_srgb,var(--critical)_12%,transparent)]"
                              onClick={() => handleRejectApplication(app.id)}
                              data-testid={`reject-btn-${app.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {app.status === "approved" && (
                          <div className="flex gap-2">
                            <Button
                              className="bg-secondary hover:bg-secondary/80"
                              data-testid={`send-invitation-btn-${app.id}`}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send Invitation
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
