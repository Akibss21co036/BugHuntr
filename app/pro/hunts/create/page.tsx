"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProHuntWizard } from "@/components/pro/pro-hunt-wizard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { getUserPermissions } from "@/lib/pro-utils";

export default function CreateProHuntPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Get user permissions
  const permissions = user
    ? getUserPermissions(user.role, user.userType)
    : null;

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (user && !permissions?.canCreateHunts) {
      router.push("/pro");
    }
  }, [user, permissions, router]);

  // Get company data from auth context
  const companyData = {
    id: user?.companyId || "company_unknown",
    name: user?.companyName || "Your Company",
  };

  const handleBackToProHunts = () => {
    router.push("/pro/hunts?view=manage");
  };

  // Show access denied if not a company
  if (user && !permissions?.canCreateHunts) {
    return (
      <div className="min-h-screen bg-[#10151c] flex items-center justify-center p-6">
        <Card className="max-w-md bg-[#181e26] border-[#23272f]">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-red-400" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-gray-400">
              Only companies can create Pro hunts. If you're a hunter and want
              to participate, please browse available hunts.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/pro")}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Go to Pro Dashboard
              </Button>
              <Button
                onClick={() => router.push("/pro/hunts")}
                variant="outline"
                className="flex-1"
              >
                Browse Hunts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#10151c] py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={handleBackToProHunts}
            className="gap-2 text-muted-foreground hover:text-foreground mb-6"
            data-testid="back-to-hunts-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Hunts
          </Button>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-black">Create Pro Hunt</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Launch an invite-only bug hunt with elite security researchers
          </p>
        </div>

        {/* Wizard */}
        <ProHuntWizard
          companyId={companyData.id}
          companyName={companyData.name}
          onComplete={() => {
            console.log("Pro Hunt created successfully");
            router.push("/pro/hunts?view=manage");
          }}
        />
      </div>
    </div>
  );
}
