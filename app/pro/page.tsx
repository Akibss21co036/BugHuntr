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
import { Badge } from "@/components/ui/badge";
import { ProBadge } from "@/components/pro/pro-badge";
import {
  Crown,
  Building2,
  Users,
  TrendingUp,
  Shield,
  ArrowRight,
  Briefcase,
  Target,
} from "lucide-react";
import { useProSubscription } from "@/hooks/use-pro-subscription";
import { useProHunts } from "@/hooks/use-pro-hunts";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { getRoleBadgeColor } from "@/lib/pro-utils";
import { RoleSwitcherDev } from "@/components/pro/role-switcher-dev";

export default function ProDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { subscription, loading: subLoading } = useProSubscription();
  const { proHunts, loading: huntsLoading } = useProHunts();

  // Simplified role logic: only system roles (admin | user)
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--border-light)]" />
      </div>
    );
  }

  const handleBackToFeed = () => {
    console.log(
      "Back button clicked in BugDetailsContent, isAuthenticated:",
      isAuthenticated,
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
      <div className="max-w-7xl mx-auto space-y-8">
        <Button
          variant="ghost"
          onClick={handleBackToFeed}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Feed</span>
          <span className="sm:hidden">Back</span>
        </Button>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-10 h-10 text-[var(--medium)]" />
              <h1 className="text-4xl font-black text-primary">
                BugHuntr Pro
              </h1>
            </div>
            <p className="text-gray-400 text-lg">
              Elite bug hunting for sensitive applications
            </p>
            {/* User Role Badge (simplified: Admin | User) */}
            {user && (
              <div className="flex gap-2 mt-3">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role === "admin" ? "Admin" : "User"}
                </Badge>
              </div>
            )}
          </div>
          <ProBadge size="lg" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-[var(--surface-elevated)] border-[var(--border-light)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Pro Hunts</p>
                  <p className="text-3xl font-black text-primary">
                    {proHunts.filter((h) => h.status === "active").length}
                  </p>
                </div>
                <Shield className="w-12 h-12 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--surface-elevated)] border-[color:color-mix(in_srgb,var(--low)_25%,transparent)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Rewards</p>
                  <p className="text-3xl font-black text-[var(--low)]">$127K</p>
                </div>
                <TrendingUp className="w-12 h-12 text-[var(--low)] opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--surface-elevated)] border-[var(--border-light)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Elite Hunters</p>
                  <p className="text-3xl font-black text-secondary">156</p>
                </div>
                <Users className="w-12 h-12 text-secondary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--surface-elevated)] border-[color:color-mix(in_srgb,var(--high)_25%,transparent)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Companies</p>
                  <p className="text-3xl font-black text-[var(--high)]">24</p>
                </div>
                <Building2 className="w-12 h-12 text-[var(--high)] opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* For Admins */}
          {isAdmin && (
            <>
              <Card
                className="bg-[#181e26] border-[#23272f] hover:border-[var(--border-light)] transition-colors cursor-pointer"
                onClick={() => router.push("/pro/hunts/create")}
                data-testid="create-pro-hunt-card"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Create Pro Hunt
                  </CardTitle>
                  <CardDescription>
                    Launch a new invite-only bug hunt with elite researchers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-primary hover:bg-[var(--accent-hover)]"
                    data-testid="create-hunt-btn"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="bg-[#181e26] border-[#23272f] hover:border-[var(--border-light)] transition-colors cursor-pointer"
                onClick={() => router.push("/pro/applications")}
                data-testid="review-applications-card"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary" />
                    Review Applications
                  </CardTitle>
                  <CardDescription>
                    Manage hunter applications and invitations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-secondary hover:bg-secondary/80"
                    data-testid="review-apps-btn"
                  >
                    View Applications
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="bg-[#181e26] border-[#23272f] hover:border-[color:color-mix(in_srgb,var(--high)_35%,transparent)] transition-colors cursor-pointer"
                onClick={() => router.push("/pro/hunts?view=manage")}
                data-testid="manage-hunts-card"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[var(--high)]" />
                    Manage My Hunts
                  </CardTitle>
                  <CardDescription>
                    View and manage your active Pro hunts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-[var(--high)] hover:bg-[color:color-mix(in_srgb,var(--high)_85%,black)]"
                    data-testid="manage-hunts-btn"
                  >
                    Manage Hunts
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="bg-[#181e26] border-[#23272f] hover:border-[color:color-mix(in_srgb,var(--low)_35%,transparent)] transition-colors cursor-pointer"
                onClick={() => router.push("/pro/hunts?view=find")}
                data-testid="browse-hunters-card"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-[var(--low)]" />
                    Find Elite Hunters
                  </CardTitle>
                  <CardDescription>
                    Browse and get AI recommendations for hunters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-[var(--low)] hover:bg-[color:color-mix(in_srgb,var(--low)_85%,black)]"
                    data-testid="find-hunters-btn"
                  >
                    Get Recommendations
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* For Regular Users */}
          {isUser && (
            <>
              <Card
                className="bg-[#181e26] border-[#23272f] hover:border-[var(--border-light)] transition-colors cursor-pointer"
                onClick={() => router.push("/pro/hunts")}
                data-testid="browse-hunts-card"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Browse Pro Hunts
                  </CardTitle>
                  <CardDescription>
                    Discover invite-only hunts with premium rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-primary hover:bg-[var(--accent-hover)]"
                    data-testid="browse-hunts-btn"
                  >
                    Explore Hunts
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="bg-[#181e26] border-[#23272f] hover:border-[color:color-mix(in_srgb,var(--low)_35%,transparent)] transition-colors cursor-pointer"
                onClick={() => router.push("/pro/applications")}
                data-testid="my-applications-card"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--low)]" />
                    My Applications
                  </CardTitle>
                  <CardDescription>
                    Track your Pro hunt applications and invitations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-[var(--low)] hover:bg-[color:color-mix(in_srgb,var(--low)_85%,black)]"
                    data-testid="my-apps-btn"
                  >
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

      {/* Development Role Switcher */}
      <RoleSwitcherDev />
    </div>
  );
}
