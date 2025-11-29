"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProBadge } from "@/components/pro/pro-badge";
import {
  Crown,
  Building2,
  Users,
  TrendingUp,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useProSubscription } from "@/hooks/use-pro-subscription";
import { useProHunts } from "@/hooks/use-pro-hunts";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";

export default function ProDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { subscription, loading: subLoading } = useProSubscription();
  const { proHunts, loading: huntsLoading } = useProHunts();
  const [userRole, setUserRole] = useState<"company" | "hunter">("hunter"); // Mock - should come from auth

  // Check if Pro feature is enabled
  useEffect(() => {
    const proEnabled = process.env.NEXT_PUBLIC_BUGHUNTR_PRO === "true";
    if (!proEnabled) {
      router.push("/feed");
    }
  }, []);

  if (subLoading || huntsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  const handleBackToFeed = () => {
    console.log(
      "Back button clicked in BugDetailsContent, isAuthenticated:",
      isAuthenticated
    );
    if (isAuthenticated) {
      console.log("Navigating to /feed");
      router.push("/feed");
    } else {
      console.log("Navigating to /");
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#10151c] p-6">
      <Button
        variant="ghost"
        onClick={handleBackToFeed}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Feed</span>
        <span className="sm:hidden">Back</span>
      </Button>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-10 h-10 text-amber-500" />
              <h1 className="text-4xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                BugHuntr Pro
              </h1>
            </div>
            <p className="text-gray-400 text-lg">
              Elite bug hunting for sensitive applications
            </p>
          </div>
          <ProBadge size="lg" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Pro Hunts</p>
                  <p className="text-3xl font-black text-blue-400">
                    {proHunts.filter((h) => h.status === "active").length}
                  </p>
                </div>
                <Shield className="w-12 h-12 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-green-900/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Rewards</p>
                  <p className="text-3xl font-black text-green-400">$127K</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Elite Hunters</p>
                  <p className="text-3xl font-black text-purple-400">156</p>
                </div>
                <Users className="w-12 h-12 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-600/20 to-amber-900/20 border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Companies</p>
                  <p className="text-3xl font-black text-amber-400">24</p>
                </div>
                <Building2 className="w-12 h-12 text-amber-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* For Companies */}
          {userRole === "company" && subscription && (
            <>
              <Card
                className="bg-[#181e26] border-[#23272f] hover:border-blue-500/50 transition-colors cursor-pointer"
                onClick={() => router.push("/pro/hunts/create")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Create Pro Hunt
                  </CardTitle>
                  <CardDescription>
                    Launch a new invite-only bug hunt with elite researchers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="bg-[#181e26] border-[#23272f] hover:border-purple-500/50 transition-colors cursor-pointer"
                onClick={() => router.push("/pro/applications")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Review Applications
                  </CardTitle>
                  <CardDescription>
                    Manage hunter applications and invitations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    View Applications
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* For Hunters */}
          {userRole === "hunter" && (
            <>
              <Card
                className="bg-[#181e26] border-[#23272f] hover:border-blue-500/50 transition-colors cursor-pointer"
                onClick={() => router.push("/pro/hunts")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Browse Pro Hunts
                  </CardTitle>
                  <CardDescription>
                    Discover invite-only hunts with premium rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Explore Hunts
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="bg-[#181e26] border-[#23272f] hover:border-green-500/50 transition-colors cursor-pointer"
                onClick={() => router.push("/pro/applications")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    My Applications
                  </CardTitle>
                  <CardDescription>
                    Track your Pro hunt applications and invitations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    View Status
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#181e26] border-[#23272f]">
            <CardHeader>
              <CardTitle className="text-lg">Invite-Only Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Pro hunts are exclusive engagements for elite researchers.
                Companies can invite specific hunters or use AI recommendations
                to find the perfect match.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#181e26] border-[#23272f]">
            <CardHeader>
              <CardTitle className="text-lg">Premium Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Pro hunts offer significantly higher bounties for critical
                vulnerabilities, with additional opportunities for job offers
                and long-term engagements.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#181e26] border-[#23272f]">
            <CardHeader>
              <CardTitle className="text-lg">Strict Confidentiality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                All Pro hunts require NDA acceptance and may include KYC
                verification. Testing is limited to approved segments to protect
                sensitive data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
