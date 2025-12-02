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
        className="fixed bottom-4 right-20 bg-purple-600 hover:bg-purple-700 z-50"
        size="sm"
        data-testid="show-role-switcher-btn"
      >
        <Shield className="w-4 h-4 mr-2" />
        Dev: Switch Role
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 bg-[#181e26] border-purple-500/50 z-50 shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
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
                user.role === "admin" ? "bg-purple-600" : "bg-blue-600"
              }
            >
              {user.role}
            </Badge>
            <Badge
              className={
                user.userType === "company" ? "bg-amber-600" : "bg-green-600"
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
              className="bg-purple-600 hover:bg-purple-700 text-xs"
              size="sm"
              data-testid="switch-admin-company-btn"
            >
              <Building2 className="w-3 h-3 mr-1" />
              Admin + Company
            </Button>
            <Button
              onClick={() => switchRole("user", "company", mockCompanyData)}
              className="bg-blue-600 hover:bg-blue-700 text-xs"
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
              className="bg-purple-600 hover:bg-purple-700 text-xs"
              size="sm"
              data-testid="switch-admin-hunter-btn"
            >
              <UserCircle className="w-3 h-3 mr-1" />
              Admin + Hunter
            </Button>
            <Button
              onClick={() => switchRole("user", "hunter", mockHunterData)}
              className="bg-green-600 hover:bg-green-700 text-xs"
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
