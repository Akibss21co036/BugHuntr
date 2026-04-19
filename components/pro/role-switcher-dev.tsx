"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-context";
import { Building2, User, Shield, UserCircle } from "lucide-react";

/**
 * Development utility component to switch between different user roles/types
 * This should only be used in development mode
 */
export function RoleSwitcherDev() {
  const { user, login } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const switchRole = (
    role: "user" | "admin",
    userType: "company" | "hunter",
    mockData: any
  ) => {
    login("test_user", "test@example.com", role, userType, mockData);
    window.location.reload(); // Reload to apply changes
  };

  const mockCompanyData = {
    companyId: "company_test_123",
    companyName: "Test Corporation",
    companyDomain: "testcorp.com",
    representativeName: "John Doe",
  };

  const mockHunterData = {
    rank: "B" as const,
    huntsParticipated: 35,
    certifications: ["OSCP", "CEH", "CISSP"],
    reputation: 4.7,
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-20 bg-secondary hover:bg-secondary/80 z-50"
        size="sm"
        data-testid="show-role-switcher-btn"
      >
        <Shield className="w-4 h-4 mr-2" />
        Dev: Switch Role
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 bg-[#181e26] border-[var(--border-light)] z-50 shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary" />
            Role Switcher (Dev Only)
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            data-testid="hide-role-switcher-btn"
          >
            ✕
          </Button>
        </div>
        {user && (
          <div className="flex gap-2 mt-2">
            <Badge
              className={
                user.role === "admin" ? "bg-secondary" : "bg-primary"
              }
            >
              {user.role}
            </Badge>
            <Badge
              className={
                user.userType === "company" ? "bg-[var(--high)]" : "bg-[var(--low)]"
              }
            >
              {user.userType}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-semibold">COMPANY ROLES</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => switchRole("admin", "company", mockCompanyData)}
              className="bg-secondary hover:bg-secondary/80 text-xs"
              size="sm"
              data-testid="switch-admin-company-btn"
            >
              <Building2 className="w-3 h-3 mr-1" />
              Admin + Company
            </Button>
            <Button
              onClick={() => switchRole("user", "company", mockCompanyData)}
              className="bg-primary hover:bg-[var(--accent-hover)] text-xs"
              size="sm"
              data-testid="switch-user-company-btn"
            >
              <Building2 className="w-3 h-3 mr-1" />
              User + Company
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-semibold">HUNTER ROLES</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => switchRole("admin", "hunter", mockHunterData)}
              className="bg-secondary hover:bg-secondary/80 text-xs"
              size="sm"
              data-testid="switch-admin-hunter-btn"
            >
              <UserCircle className="w-3 h-3 mr-1" />
              Admin + Hunter
            </Button>
            <Button
              onClick={() => switchRole("user", "hunter", mockHunterData)}
              className="bg-[var(--low)] hover:bg-[color:color-mix(in_srgb,var(--low)_85%,black)] text-xs"
              size="sm"
              data-testid="switch-user-hunter-btn"
            >
              <UserCircle className="w-3 h-3 mr-1" />
              User + Hunter
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500 italic">
            Note: Page will reload after switching roles
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
