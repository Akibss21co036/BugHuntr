"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Shield } from "lucide-react";
import { type HunterEligibility } from "@/types/pro";

interface ProEligibilityCardProps {
  eligibility: HunterEligibility;
}

export function ProEligibilityCard({ eligibility }: ProEligibilityCardProps) {
  return (
    <Card className="bg-[#181e26] border-[#23272f]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          BugHuntr Pro Eligibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Status</span>
          {eligibility.isEligible ? (
            <Badge className="bg-green-600 text-white">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Eligible
            </Badge>
          ) : (
            <Badge className="bg-red-600 text-white">
              <XCircle className="w-4 h-4 mr-1" />
              Not Eligible
            </Badge>
          )}
        </div>

        {/* Current Stats */}
        <div className="space-y-2 py-4 border-t border-b border-[#23272f]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Current Rank</span>
            <span className="font-bold">{eligibility.rank}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Hunts Participated</span>
            <span className="font-bold">{eligibility.huntsParticipated}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Certifications</span>
            <span className="font-bold">
              {eligibility.certifications.length}
            </span>
          </div>
        </div>

        {/* Requirements Met */}
        {eligibility.reasons.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Requirements Met
            </h4>
            <ul className="space-y-1">
              {eligibility.reasons.map((reason, index) => (
                <li key={index} className="text-sm text-gray-300">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Requirements */}
        {eligibility.missingRequirements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Missing Requirements
            </h4>
            <ul className="space-y-1">
              {eligibility.missingRequirements.map((req, index) => (
                <li key={index} className="text-sm text-gray-300">
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Certifications */}
        {eligibility.certifications.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Your Certifications</h4>
            <div className="flex flex-wrap gap-2">
              {eligibility.certifications.map((cert) => (
                <Badge
                  key={cert}
                  className="bg-amber-500/10 text-amber-400 border-amber-500/30"
                >
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
