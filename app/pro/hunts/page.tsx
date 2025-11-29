"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Filter } from "lucide-react";
import { useProHunts } from "@/hooks/use-pro-hunts";
import { useProEligibility } from "@/hooks/use-pro-eligibility";
import { mockProHunts } from "@/data/mock-pro-data";
import { type ProHunt } from "@/types/pro";

export default function ProHuntsPage() {
  const { proHunts, loading } = useProHunts();
  const { checkHunterEligibility } = useProEligibility();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedHunt, setSelectedHunt] = useState<ProHunt | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [ndaModalOpen, setNdaModalOpen] = useState(false);

  // Mock hunter data - in production, this would come from auth/user context
  const mockHunterData = {
    id: "hunter_current",
    name: "CurrentHunter",
    rank: "B",
    huntsParticipated: 30,
    certifications: ["OSCP", "CEH"],
  };

  const eligibility = checkHunterEligibility(
    mockHunterData.rank,
    mockHunterData.huntsParticipated,
    mockHunterData.certifications
  );

  // Filter hunts
  const filteredHunts = proHunts.filter((hunt) => {
    const matchesSearch =
      hunt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hunt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hunt.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || hunt.status === statusFilter;
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
      mockHunterData.rank,
      mockHunterData.huntsParticipated,
      mockHunterData.certifications,
      hunt.minRank,
      hunt.minHuntsParticipated,
      hunt.requiredCertifications
    ).isEligible;
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
        <div>
          <h1 className="text-3xl font-black mb-2">Browse Pro Hunts</h1>
          <p className="text-gray-400">
            Discover elite bug hunting opportunities with premium rewards
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hunts by title, company, or description..."
              className="pl-10 bg-[#181e26] border-[#23272f]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-[#181e26] border-[#23272f]">
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
          {/* Sidebar - Eligibility */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ProEligibilityCard eligibility={eligibility} />
            </div>
          </div>

          {/* Main Content - Hunt Cards */}
          <div className="lg:col-span-3 space-y-4">
            {filteredHunts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  No Pro hunts found matching your criteria
                </p>
              </div>
            ) : (
              filteredHunts.map((hunt) => (
                <ProHuntCard
                  key={hunt.id}
                  hunt={hunt}
                  onApply={() => handleApply(hunt)}
                  onViewDetails={() => handleViewDetails(hunt)}
                  isEligible={checkHuntEligibility(hunt)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {selectedHunt && (
        <ProApplyModal
          open={applyModalOpen}
          onOpenChange={setApplyModalOpen}
          hunt={selectedHunt}
          hunterId={mockHunterData.id}
          hunterName={mockHunterData.name}
          hunterRank={mockHunterData.rank}
        />
      )}

      {/* NDA Modal */}
      {selectedHunt && (
        <ProNdaModal
          open={ndaModalOpen}
          onOpenChange={setNdaModalOpen}
          huntId={selectedHunt.id}
          huntTitle={selectedHunt.title}
          companyName={selectedHunt.companyName}
          ndaText={selectedHunt.ndaTemplateText}
          hunterId={mockHunterData.id}
          hunterName={mockHunterData.name}
          onSign={(hash) => {
            console.log("NDA signed with hash:", hash);
          }}
        />
      )}
    </div>
  );
}
