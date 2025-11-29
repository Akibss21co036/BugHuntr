"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mail, TrendingUp, Award, Shield } from "lucide-react";
import { type ProRecommendation } from "@/types/pro";
import { useProRecommendations } from "@/hooks/use-pro-recommendations";
import { toast } from "sonner";

interface ProRecommendationsPanelProps {
  huntId: string;
  minRank: string;
  minHunts: number;
  requiredCerts: string[];
  onInvite?: (hunterId: string, hunterName: string) => void;
}

export function ProRecommendationsPanel({
  huntId,
  minRank,
  minHunts,
  requiredCerts,
  onInvite,
}: ProRecommendationsPanelProps) {
  const { generateRecommendations, loading } = useProRecommendations();
  const [recommendations, setRecommendations] = useState<ProRecommendation[]>(
    []
  );
  const [inviting, setInviting] = useState<string | null>(null);

  const handleGenerate = async () => {
    const recs = await generateRecommendations(
      huntId,
      minRank,
      minHunts,
      requiredCerts
    );
    setRecommendations(recs);
  };

  const handleInvite = async (hunterId: string, hunterName: string) => {
    setInviting(hunterId);
    try {
      // Simulate invite
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Invitation sent to ${hunterName}`);
      onInvite?.(hunterId, hunterName);
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setInviting(null);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "S":
        return "text-purple-400 bg-purple-500/10 border-purple-500/30";
      case "A":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "B":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {recommendations.length === 0 ? (
        <Card className="bg-[#181e26] border-[#23272f]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="w-16 h-16 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">
              AI-Powered Hunter Recommendations
            </h3>
            <p className="text-gray-400 text-center mb-6 max-w-md">
              Our algorithm will analyze hunter profiles, expertise, reputation,
              and track records to recommend the best candidates for your Pro
              Hunt.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Top {recommendations.length} Recommended Hunters
              </h2>
              <p className="text-gray-400">
                Ranked by expertise, reputation, and eligibility
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              variant="outline"
              disabled={loading}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4">
            {recommendations.map((rec, index) => (
              <Card
                key={rec.hunterId}
                className="bg-[#181e26] border-[#23272f] hover:border-blue-500/30 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Rank Badge */}
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-blue-500">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl">
                            {rec.hunterName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-[#181e26] ${getRankColor(
                            rec.rank
                          )}`}
                        >
                          {rec.rank}
                        </div>
                      </div>

                      {/* Hunter Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold">
                            {rec.hunterName}
                          </h3>
                          <Badge className="bg-blue-600 text-white">
                            #{index + 1} Match
                          </Badge>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{rec.huntsParticipated} hunts</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            <span>
                              {rec.reputation.toFixed(1)}/5 reputation
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            <span>
                              {Math.round(rec.successRate * 100)}% success
                            </span>
                          </div>
                        </div>

                        {/* Match Score */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-400">Match Score</span>
                            <span className="font-bold text-green-400">
                              {rec.matchPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${rec.matchPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Reason Tags */}
                        <div className="flex flex-wrap gap-2">
                          {rec.reasonTags.map((tag, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="bg-[#10151c] border-[#23272f] text-gray-300"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Certifications */}
                        {rec.certifications.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">
                              Certifications:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rec.certifications.map((cert) => (
                                <Badge
                                  key={cert}
                                  className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs"
                                >
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Invite Button */}
                    <Button
                      onClick={() => handleInvite(rec.hunterId, rec.hunterName)}
                      disabled={inviting === rec.hunterId}
                      className="bg-blue-600 hover:bg-blue-700 ml-4"
                    >
                      {inviting === rec.hunterId ? (
                        "Sending..."
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Invite
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
