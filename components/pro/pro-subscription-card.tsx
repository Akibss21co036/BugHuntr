"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
import { type ProSubscription } from "@/types/pro";
import { formatDateRange } from "@/lib/pro-utils";

interface ProSubscriptionCardProps {
  subscription: ProSubscription | null;
  onUpgrade?: () => void;
}

export function ProSubscriptionCard({
  subscription,
  onUpgrade,
}: ProSubscriptionCardProps) {
  if (!subscription) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/20 to-purple-500/20 border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Upgrade to Pro
          </CardTitle>
          <CardDescription>
            Access invite-only bug hunts with elite researchers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span>AI-powered hunter recommendations</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span>Custom NDA templates</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span>KYC verification</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span>Talent pipeline features</span>
            </li>
          </ul>
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-amber-500 to-purple-600"
          >
            <Zap className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusColors = {
    active: "bg-green-600",
    expired: "bg-red-600",
    suspended: "bg-yellow-600",
  };

  const planNames = {
    basic: "Basic",
    premium: "Premium",
    enterprise: "Enterprise",
  };

  return (
    <Card className="bg-[#181e26] border-amber-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            BugHuntr Pro
          </CardTitle>
          <Badge className={statusColors[subscription.status]}>
            {subscription.status.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>
          {planNames[subscription.planType]} Plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Pro Hunts</span>
            <span className="font-semibold">
              {subscription.currentProHunts} / {subscription.maxProHunts}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
              style={{
                width: `${
                  (subscription.currentProHunts / subscription.maxProHunts) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Subscription Period */}
        <div className="text-sm">
          <p className="text-gray-400">Valid until</p>
          <p className="font-semibold">
            {new Date(subscription.endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Features */}
        <div>
          <p className="text-sm font-semibold mb-2">Included Features:</p>
          <ul className="space-y-1">
            {subscription.features.map((feature, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-xs text-gray-300"
              >
                <Check className="w-3 h-3 text-green-400" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {subscription.planType !== "enterprise" && (
          <Button onClick={onUpgrade} variant="outline" className="w-full">
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
