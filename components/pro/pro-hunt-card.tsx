"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProBadge } from "./pro-badge";
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  Shield,
  Target,
  Award,
} from "lucide-react";
import { type ProHunt } from "@/types/pro";
import {
  formatCurrency,
  getDaysRemaining,
  formatDateRange,
} from "@/lib/pro-utils";

interface ProHuntCardProps {
  hunt: ProHunt;
  onApply?: () => void;
  onViewDetails?: () => void;
  showActions?: boolean;
  isEligible?: boolean;
}

export function ProHuntCard({
  hunt,
  onApply,
  onViewDetails,
  showActions = true,
  isEligible = true,
}: ProHuntCardProps) {
  const daysRemaining = getDaysRemaining(hunt.endsAt);
  const dateRange = formatDateRange(hunt.startsAt, hunt.endsAt);
  const spotsRemaining = hunt.maxHunters - hunt.currentHunters;

  return (
    <Card className="bg-gradient-to-br from-[#181e26] to-[#10151c] border-2 border-amber-500/30 hover:border-amber-500/50 transition-all group relative overflow-hidden">
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ProBadge size="sm" />
              {hunt.inviteOnly && (
                <Badge className="bg-purple-600 text-white text-xs">
                  Invite Only
                </Badge>
              )}
              <Badge
                className={`text-xs ${
                  hunt.status === "active"
                    ? "bg-green-600"
                    : hunt.status === "paused"
                    ? "bg-yellow-600"
                    : "bg-gray-600"
                }`}
              >
                {hunt.status}
              </Badge>
            </div>
            <CardTitle className="text-xl mb-2 group-hover:text-blue-400 transition-colors">
              {hunt.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Building2 className="w-4 h-4" />
              <span>{hunt.companyName}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Description */}
        <p className="text-gray-300 text-sm line-clamp-2">{hunt.description}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#10151c]/50 rounded-lg p-3 border border-[#23272f]">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Max Reward</span>
            </div>
            <div className="text-lg font-bold text-green-400">
              {formatCurrency(hunt.rewards.critical)}
            </div>
          </div>
          <div className="bg-[#10151c]/50 rounded-lg p-3 border border-[#23272f]">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Users className="w-3 h-3" />
              <span>Spots Left</span>
            </div>
            <div className="text-lg font-bold">
              {spotsRemaining}/{hunt.maxHunters}
            </div>
          </div>
          <div className="bg-[#10151c]/50 rounded-lg p-3 border border-[#23272f]">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Calendar className="w-3 h-3" />
              <span>Time Remaining</span>
            </div>
            <div className="text-lg font-bold text-blue-400">
              {daysRemaining}d
            </div>
          </div>
          <div className="bg-[#10151c]/50 rounded-lg p-3 border border-[#23272f]">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Shield className="w-3 h-3" />
              <span>Min Rank</span>
            </div>
            <div className="text-lg font-bold">{hunt.minRank}</div>
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Target className="w-3 h-3" />
            <span>Min {hunt.minHuntsParticipated} hunts participated</span>
          </div>
          {hunt.requireKYC && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Shield className="w-3 h-3" />
              <span>KYC verification required</span>
            </div>
          )}
          {hunt.requiredCertifications.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Award className="w-3 h-3" />
              <span>
                Certifications: {hunt.requiredCertifications.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Rewards Breakdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Rewards:</span>
          <Badge className="bg-red-600/20 text-red-400 text-xs">
            Critical: {formatCurrency(hunt.rewards.critical)}
          </Badge>
          <Badge className="bg-orange-600/20 text-orange-400 text-xs">
            High: {formatCurrency(hunt.rewards.high)}
          </Badge>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onViewDetails}
              variant="outline"
              className="flex-1 border-[#23272f] hover:border-blue-500"
              size="sm"
            >
              View Details
            </Button>
            {!hunt.inviteOnly && isEligible && (
              <Button
                onClick={onApply}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="sm"
              >
                Apply Now
              </Button>
            )}
            {hunt.inviteOnly && (
              <Button disabled className="flex-1" size="sm">
                Invite Only
              </Button>
            )}
          </div>
        )}

        {!isEligible && showActions && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400 text-center">
              ⚠️ You don't meet the eligibility requirements for this hunt
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
