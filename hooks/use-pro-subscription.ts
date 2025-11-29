"use client";

import { useState, useEffect } from "react";
import { type ProSubscription } from "@/types/pro";
import { mockProSubscriptions } from "@/data/mock-pro-data";

export function useProSubscription() {
  const [subscription, setSubscription] = useState<ProSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading subscription data
    setTimeout(() => {
      // For mock, use first subscription
      setSubscription(mockProSubscriptions[0]);
      setLoading(false);
    }, 300);
  }, []);

  const purchaseSubscription = async (
    companyId: string,
    companyName: string,
    planType: "basic" | "premium" | "enterprise"
  ) => {
    // Mock subscription purchase
    const features = {
      basic: ["5 Pro hunts/year", "AI recommendations", "Basic support"],
      premium: [
        "10 Pro hunts/year",
        "Unlimited invites",
        "AI recommendations",
        "KYC verification",
        "Custom NDAs",
        "Talent pipeline",
      ],
      enterprise: [
        "25 Pro hunts/year",
        "Unlimited invites",
        "AI recommendations",
        "KYC verification",
        "Custom NDAs",
        "Talent pipeline",
        "Dedicated support",
        "Custom integrations",
      ],
    };

    const maxHunts = {
      basic: 5,
      premium: 10,
      enterprise: 25,
    };

    const newSubscription: ProSubscription = {
      id: `sub_${Date.now()}`,
      companyId,
      companyName,
      planType,
      status: "active",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      maxProHunts: maxHunts[planType],
      currentProHunts: 0,
      features: features[planType],
    };

    setSubscription(newSubscription);
    return newSubscription;
  };

  const hasActiveSubscription = () => {
    return subscription && subscription.status === "active";
  };

  const canCreateProHunt = () => {
    if (!subscription) return false;
    return subscription.currentProHunts < subscription.maxProHunts;
  };

  return {
    subscription,
    loading,
    purchaseSubscription,
    hasActiveSubscription,
    canCreateProHunt,
  };
}
