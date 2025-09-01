"use client"

import { useState, useCallback, useEffect } from "react"

interface UserHuntParticipation {
  huntId: string
  joinedAt: Date
  status: "active" | "completed" | "removed"
}

export function useUserHunts() {
  const [joinedHunts, setJoinedHunts] = useState<UserHuntParticipation[]>([])

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
    setJoinedHunts((prev: UserHuntParticipation[]) => [
      ...prev.filter((h: UserHuntParticipation) => h.huntId !== huntId),
      {
        huntId,
        joinedAt: new Date(),
        status: "active",
      },
    ]);
  }, []);

  const leaveHunt = useCallback((huntId: string) => {
    setJoinedHunts((prev: UserHuntParticipation[]) => prev.filter((h: UserHuntParticipation) => h.huntId !== huntId));
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
    setJoinedHunts((prev: UserHuntParticipation[]) => prev.map((h: UserHuntParticipation) => (h.huntId === huntId ? { ...h, status: "removed" as const } : h)));
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
