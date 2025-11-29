"use client";

import { useState, useEffect } from "react";
import { type ProHunt, type ProSubmission } from "@/types/pro";
import { mockProHunts } from "@/data/mock-pro-data";

export function useProHunts() {
  const [proHunts, setProHunts] = useState<ProHunt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading from API
    setTimeout(() => {
      setProHunts(mockProHunts);
      setLoading(false);
    }, 500);
  }, []);

  const createProHunt = async (
    huntData: Omit<ProHunt, "id" | "createdAt" | "updatedAt" | "currentHunters">
  ) => {
    const newHunt: ProHunt = {
      ...huntData,
      id: `prohunt_${Date.now()}`,
      currentHunters: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProHunts((prev) => [...prev, newHunt]);
    return newHunt;
  };

  const updateProHunt = async (huntId: string, updates: Partial<ProHunt>) => {
    setProHunts((prev) =>
      prev.map((hunt) =>
        hunt.id === huntId
          ? { ...hunt, ...updates, updatedAt: new Date().toISOString() }
          : hunt
      )
    );
  };

  const deleteProHunt = async (huntId: string) => {
    setProHunts((prev) => prev.filter((hunt) => hunt.id !== huntId));
  };

  const getProHuntById = (huntId: string) => {
    return proHunts.find((hunt) => hunt.id === huntId);
  };

  const getActiveProHunts = () => {
    return proHunts.filter((hunt) => hunt.status === "active");
  };

  const getCompanyProHunts = (companyId: string) => {
    return proHunts.filter((hunt) => hunt.companyId === companyId);
  };

  return {
    proHunts,
    loading,
    createProHunt,
    updateProHunt,
    deleteProHunt,
    getProHuntById,
    getActiveProHunts,
    getCompanyProHunts,
  };
}
