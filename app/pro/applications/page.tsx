"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, XCircle, Mail } from "lucide-react";
import { useProApplications } from "@/hooks/use-pro-applications";
import { formatDateRange } from "@/lib/pro-utils";

export default function ProApplicationsPage() {
  const { applications, loading } = useProApplications();
  const [activeTab, setActiveTab] = useState("all");

  // Mock current user ID
  const currentUserId = "hunter_current";

  // Filter applications for current user
  const myApplications = applications.filter(
    (app) => app.hunterId === currentUserId
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-600";
      case "rejected":
        return "bg-red-600";
      case "pending":
        return "bg-yellow-600";
      case "more_info_requested":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const filteredApplications = myApplications.filter((app) => {
    if (activeTab === "all") return true;
    return app.status === activeTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#10151c] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black mb-2">My Pro Applications</h1>
          <p className="text-gray-400">
            Track your Pro hunt applications and invitations
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#181e26] border-[#23272f]">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{myApplications.length}</div>
              <div className="text-sm text-gray-400">Total Applications</div>
            </CardContent>
          </Card>
          <Card className="bg-[#181e26] border-[#23272f]">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {myApplications.filter((a) => a.status === "pending").length}
              </div>
              <div className="text-sm text-gray-400">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-[#181e26] border-[#23272f]">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">
                {myApplications.filter((a) => a.status === "approved").length}
              </div>
              <div className="text-sm text-gray-400">Approved</div>
            </CardContent>
          </Card>
          <Card className="bg-[#181e26] border-[#23272f]">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-400">
                {myApplications.filter((a) => a.status === "rejected").length}
              </div>
              <div className="text-sm text-gray-400">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#181e26]">
            <TabsTrigger value="all">All ({myApplications.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending (
              {myApplications.filter((a) => a.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved (
              {myApplications.filter((a) => a.status === "approved").length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected (
              {myApplications.filter((a) => a.status === "rejected").length})
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
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Pro Hunts
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredApplications.map((app) => (
                <Card
                  key={app.id}
                  className="bg-[#181e26] border-[#23272f] hover:border-blue-500/30 transition-colors"
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
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-400 mb-1">
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

                    {/* Actions */}
                    {app.status === "approved" && (
                      <div className="flex gap-2">
                        <Button className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Sign NDA & Begin
                        </Button>
                        <Button variant="outline">View Hunt Details</Button>
                      </div>
                    )}

                    {app.status === "more_info_requested" && (
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Mail className="w-4 h-4 mr-2" />
                        Provide Additional Info
                      </Button>
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
