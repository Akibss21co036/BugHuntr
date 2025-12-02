"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProHuntCard } from "@/components/pro/pro-hunt-card";
import { ProEligibilityCard } from "@/components/pro/pro-eligibility-card";
import { ProApplyModal } from "@/components/pro/pro-apply-modal";
import { ProNdaModal } from "@/components/pro/pro-nda-modal";
import { ProRecommendationsPanel } from "@/components/pro/pro-recommendations-panel";
import { Search, Filter, ArrowLeft, Plus } from "lucide-react";
import { useProHunts } from "@/hooks/use-pro-hunts";
import { useProEligibility } from "@/hooks/use-pro-eligibility";
import { mockProHunts } from "@/data/mock-pro-data";
import { type ProHunt } from "@/types/pro";
import { useAuth } from "@/components/auth/auth-context";
import { getUserPermissions } from "@/lib/pro-utils";

export default function ProHuntsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");

  const { user } = useAuth();
  const { proHunts, loading } = useProHunts();
  const { checkHunterEligibility } = useProEligibility();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedHunt, setSelectedHunt] = useState<ProHunt | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Get user permissions
  const permissions = user
    ? getUserPermissions(user.role, user.userType)
    : null;

  const isAdmin = user?.role === "admin";
  const isCompany = Boolean(permissions?.isCompany) || isAdmin;
  // Company presence indicates company-scoped manage view; admins without a company
  // should still be able to open 'My Hunts' but only see hunts they created.
  const hasCompanyAccount = Boolean(user?.companyId);
  // Fallback: if permissions are missing but the user object contains hunter-specific data
  // (rank or huntsParticipated), treat them as a hunter for the purposes of showing the
  // eligibility card. Admins are explicitly excluded from hunter UI.
  const hasHunterData = Boolean(user?.rank) || Boolean(user?.huntsParticipated);
  const isHunter =
    (Boolean(permissions?.isHunter) || hasHunterData) && !isAdmin;
  const canCreate = Boolean(permissions?.canCreateHunts) || isAdmin;

  // Determine view mode: 'manage' for companies (or admins), 'browse' otherwise
  const [viewMode, setViewMode] = useState<"browse" | "manage">(
    viewParam === "manage" && (hasCompanyAccount || isAdmin)
      ? "manage"
      : "browse"
  );

  // Get hunter data from auth context or use defaults
  const hunterData = {
    id: user?.id || "hunter_current",
    name: user?.username || "CurrentHunter",
    rank: user?.rank || "B",
    huntsParticipated: user?.huntsParticipated || 30,
    certifications: user?.certifications || ["OSCP", "CEH"],
  };

  const eligibility = checkHunterEligibility(
    hunterData.rank,
    hunterData.huntsParticipated,
    hunterData.certifications
  );

  // Filter hunts based on view mode
  const filteredHunts = proHunts.filter((hunt) => {
    const matchesSearch =
      hunt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hunt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hunt.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || hunt.status === statusFilter;

    // In manage mode, show hunts for the company if the user has a company account,
    // otherwise if the user is an admin show only hunts they created (createdBy === user.id)
    if (viewMode === "manage") {
      if (hasCompanyAccount) {
        return (
          matchesSearch && matchesStatus && hunt.companyId === user!.companyId
        );
      }
      if (isAdmin) {
        return matchesSearch && matchesStatus && hunt.createdBy === user!.id;
      }
      // If manage mode but neither company nor admin, fall back to nothing
      return false;
    }

    return matchesSearch && matchesStatus;
  });

  const handleApply = (hunt: ProHunt) => {
    setSelectedHunt(hunt);
    setApplyModalOpen(true);
  };

  const handleViewDetails = (hunt: ProHunt) => {
    // Navigate to hunt details page or open modal
    console.log("View details:", hunt);
  };

  const checkHuntEligibility = (hunt: ProHunt) => {
    return checkHunterEligibility(
      hunterData.rank,
      hunterData.huntsParticipated,
      hunterData.certifications,
      hunt.minRank,
      hunt.minHuntsParticipated,
      hunt.requiredCertifications
    ).isEligible;
  };

  const handleBackToProDashboard = () => {
    router.push("/pro");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#10151c] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              {viewMode === "manage"
                ? "Manage My Pro Hunts"
                : "Browse Pro Hunts"}
            </h1>
            <p className="text-gray-400">
              {viewMode === "manage"
                ? "View and manage your active Pro hunts"
                : "Discover elite bug hunting opportunities with premium rewards"}
            </p>
          </div>
          {canCreate && viewMode === "manage" && hasCompanyAccount && (
            <Button
              onClick={() => router.push("/pro/hunts/create")}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="create-new-hunt-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Hunt
            </Button>
          )}
        </div>

        {/* View Mode Tabs (only for companies) */}
        {(hasCompanyAccount || isAdmin) && (
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "browse" | "manage")}
          >
            <TabsList className="bg-[#181e26]">
              <TabsTrigger value="browse" data-testid="browse-tab">
                Browse All Hunts
              </TabsTrigger>
              <TabsTrigger value="manage" data-testid="manage-tab">
                My Hunts
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hunts by title, company, or description..."
              className="pl-10 bg-[#181e26] border-[#23272f]"
              data-testid="search-hunts-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-full md:w-48 bg-[#181e26] border-[#23272f]"
              data-testid="status-filter"
            >
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Different for each view mode */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Hunter Eligibility Card (visible to system 'user' role in browse mode) */}
              {viewMode === "browse" && user?.role === "user" && (
                <ProEligibilityCard eligibility={eligibility} />
              )}

              {/* Company Actions (only in manage mode for companies) */}
              {viewMode === "manage" && isCompany && (
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowRecommendations(!showRecommendations)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    data-testid="toggle-recommendations-btn"
                  >
                    {showRecommendations ? "Hide" : "Show"} AI Recommendations
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Hunt Cards */}
          <div className="lg:col-span-3 space-y-4">
            {/* AI Recommendations Panel (for companies in manage mode) */}
            {showRecommendations &&
              viewMode === "manage" &&
              selectedHunt &&
              isCompany && (
                <ProRecommendationsPanel
                  huntId={selectedHunt.id}
                  minRank={selectedHunt.minRank}
                  minHunts={selectedHunt.minHuntsParticipated}
                  requiredCerts={selectedHunt.requiredCertifications}
                  onInvite={(hunterId) => {
                    console.log("Invite hunter:", hunterId);
                  }}
                />
              )}

            {filteredHunts.length === 0 ? (
              <div className="text-center py-12" data-testid="no-hunts-message">
                <p className="text-gray-400 text-lg">
                  {viewMode === "manage"
                    ? "You haven't created any Pro hunts yet"
                    : "No Pro hunts found matching your criteria"}
                </p>
                {viewMode === "manage" && canCreate && (
                  <Button
                    onClick={() => router.push("/pro/hunts/create")}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                    data-testid="create-first-hunt-btn"
                  >
                    Create Your First Hunt
                  </Button>
                )}
              </div>
            ) : (
              filteredHunts.map((hunt) => (
                <ProHuntCard
                  key={hunt.id}
                  hunt={hunt}
                  onApply={() => handleApply(hunt)}
                  onViewDetails={() => {
                    handleViewDetails(hunt);
                    if (viewMode === "manage") {
                      setSelectedHunt(hunt);
                    }
                  }}
                  isEligible={checkHuntEligibility(hunt)}
                  isManageView={viewMode === "manage"}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal (only for hunters) */}
      {selectedHunt && isHunter && (
        <ProApplyModal
          open={applyModalOpen}
          onOpenChange={setApplyModalOpen}
          hunt={selectedHunt}
          hunterId={hunterData.id}
          hunterName={hunterData.name}
          hunterRank={hunterData.rank}
        />
      )}

      {/* NDA Modal (only for hunters) */}
      {selectedHunt && isHunter && (
        <ProNdaModal
          open={ndaModalOpen}
          onOpenChange={setNdaModalOpen}
          huntId={selectedHunt.id}
          huntTitle={selectedHunt.title}
          companyName={selectedHunt.companyName}
          ndaText={selectedHunt.ndaTemplateText}
          hunterId={hunterData.id}
          hunterName={hunterData.name}
          onSign={(hash) => {
            console.log("NDA signed with hash:", hash);
          }}
        />
      )}
    </div>
  );
}
