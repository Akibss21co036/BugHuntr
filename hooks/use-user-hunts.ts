"use client"

import { useState, useCallback, useEffect } from "react"

interface UserHuntParticipation {
  huntId: string
  joinedAt: Date
  status: "active" | "completed" | "removed"
}

export function useUserHunts() {
  const [joinedHunts, setJoinedHunts] = useState<UserHuntParticipation[]>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("joinedHunts");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.map((h: any) => ({ ...h, joinedAt: new Date(h.joinedAt) }));
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    const handleHuntRemoved = (event: CustomEvent) => {
      const { huntId } = event.detail;
      setJoinedHunts((prev: UserHuntParticipation[]) => prev.filter((h: UserHuntParticipation) => h.huntId !== huntId));
    };
    if (typeof window !== "undefined") {
      window.addEventListener("huntRemoved", handleHuntRemoved as EventListener);
      return () => window.removeEventListener("huntRemoved", handleHuntRemoved as EventListener);
    }
    return undefined;
  }, []);

  const joinHunt = useCallback((huntId: string) => {
    setJoinedHunts((prev: UserHuntParticipation[]) => {
      const updated: UserHuntParticipation[] = [
        ...prev.filter((h: UserHuntParticipation) => h.huntId !== huntId),
        {
          huntId,
          joinedAt: new Date(),
          status: "active" as "active",
        },
      ];
      if (typeof window !== "undefined") {
        window.localStorage.setItem("joinedHunts", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("incrementParticipants", { detail: { huntId } }));
      }
      return updated;
    });
  }, []);

  const leaveHunt = useCallback((huntId: string) => {
    setJoinedHunts((prev: UserHuntParticipation[]) => {
      const updated = prev.filter((h: UserHuntParticipation) => h.huntId !== huntId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("joinedHunts", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const isJoinedToHunt = useCallback(
    (huntId: string) => {
      return joinedHunts.some((h: UserHuntParticipation) => h.huntId === huntId && h.status === "active");
    },
    [joinedHunts],
  );

  const getJoinedHunts = useCallback(() => {
    return joinedHunts.filter((h: UserHuntParticipation) => h.status === "active");
  }, [joinedHunts]);

  const removeUserFromHunt = useCallback((huntId: string) => {
    setJoinedHunts((prev: UserHuntParticipation[]) => {
      const updated = prev.map((h: UserHuntParticipation) => (h.huntId === huntId ? { ...h, status: "removed" as const } : h));
      if (typeof window !== "undefined") {
        window.localStorage.setItem("joinedHunts", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return {
    joinHunt,
    leaveHunt,
    isJoinedToHunt,
    getJoinedHunts,
    removeUserFromHunt,
    joinedHunts: joinedHunts.filter((h: UserHuntParticipation) => h.status === "active"),
  };
}
