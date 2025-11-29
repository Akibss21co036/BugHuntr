"use client";

import { ProHuntWizard } from "@/components/pro/pro-hunt-wizard";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function CreateProHuntPage() {
  // Mock company data - in production, get from auth context
  const mockCompanyData = {
    id: "company_1",
    name: "My Company",
  };

  return (
    <div className="min-h-screen bg-[#10151c] py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
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
          companyId={mockCompanyData.id}
          companyName={mockCompanyData.name}
          onComplete={() => {
            console.log("Pro Hunt created successfully");
          }}
        />
      </div>
    </div>
  );
}
