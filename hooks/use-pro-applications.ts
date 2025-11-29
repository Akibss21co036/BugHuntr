"use client";

import { useState, useEffect } from "react";
import { type ProApplication } from "@/types/pro";
import { mockProApplications } from "@/data/mock-pro-data";

export function useProApplications() {
  const [applications, setApplications] = useState<ProApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading from API
    setTimeout(() => {
      setApplications(mockProApplications);
      setLoading(false);
    }, 300);
  }, []);

  const submitApplication = async (
    huntId: string,
    huntTitle: string,
    hunterId: string,
    hunterName: string,
    hunterRank: string,
    cover: string,
    bidAmount?: number,
    attachments: string[] = []
  ) => {
    const newApplication: ProApplication = {
      id: `app_${Date.now()}`,
      huntId,
      huntTitle,
      hunterId,
      hunterName,
      hunterRank,
      cover,
      bidAmount,
      attachments,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    setApplications((prev) => [...prev, newApplication]);
    return newApplication;
  };

  const reviewApplication = async (
    applicationId: string,
    status: "approved" | "rejected" | "more_info_requested",
    reviewNotes: string
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status,
              reviewNotes,
              reviewedAt: new Date().toISOString(),
            }
          : app
      )
    );
  };

  const getApplicationsByHunt = (huntId: string) => {
    return applications.filter((app) => app.huntId === huntId);
  };

  const getApplicationsByHunter = (hunterId: string) => {
    return applications.filter((app) => app.hunterId === hunterId);
  };

  return {
    applications,
    loading,
    submitApplication,
    reviewApplication,
    getApplicationsByHunt,
    getApplicationsByHunter,
  };
}
