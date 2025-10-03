
"use client"
// Utility function for deterministic date formatting
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserStatsCards } from "@/components/dashboard/user-stats-cards"
import { useAuth } from "@/components/auth/auth-context"
import { useBugHunt } from "@/hooks/use-bug-hunt"
import { useBugSubmission } from "@/hooks/use-bug-submission"
import { useUserHunts } from "@/hooks/use-user-hunts"
import { useEffect, useState, useCallback } from "react"
import { getUserProfileByUsername } from "@/lib/get-user-profile"


const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    case "high":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20"
    case "medium":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    case "low":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "accepted":
      return "bg-green-500/10 text-green-500 border-green-500/20"
    case "under review":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "triaging":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    case "rejected":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

const getCertificateStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-500/10 text-green-500 border-green-500/20"
    case "expiring":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    case "expired":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

export default function DashboardPage() {

  const { user } = useAuth();
  const { bugHunts, getSubmissionsByUser: getHuntSubmissionsByUser } = useBugHunt();
  const { submissions: bugSubmissions, getSubmissionsByUser: getBugSubmissionsByUser } = useBugSubmission();
  const { joinedHunts } = useUserHunts();
  const [profilePoints, setProfilePoints] = useState<number | null>(null);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    setPointsLoading(true);
    setPointsError(null);
    try {
      if (user?.username) {
        const profile = await getUserProfileByUsername(user.username);
        setProfilePoints((profile as any)?.points ?? 0);
      } else {
        setProfilePoints(null);
      }
    } catch (err) {
      setPointsError("Failed to load points");
      setProfilePoints(null);
    } finally {
      setPointsLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchPoints();
    
    // Set up an interval to refresh points every 10 seconds
    const interval = setInterval(() => {
      fetchPoints();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchPoints]);

  // Defensive: if not logged in, show nothing
  if (!user) return <div className="p-8 text-center">Please log in to view your dashboard.</div>;

  // Bug hunts joined (from local state)
  const joinedHuntIds = joinedHunts.map((h) => h.huntId);
  const joinedHuntObjs = bugHunts.filter((hunt) => joinedHuntIds.includes(hunt.id));

  // Bugs reported (submissions in bugHuntSubmissions by user)
  const huntSubmissions = getHuntSubmissionsByUser(user.id) || [];

  // Bugs submitted (submissions in bugs collection by user)
  const bugSubmissionsByUser = bugSubmissions.filter((s) => s.submittedBy === user.id);


  // Points earned: use Firestore userProfiles points if available, else fallback to old calculation
  let pointsEarned = 0;
  if (pointsLoading) {
    pointsEarned = 0;
  } else if (profilePoints !== null) {
    pointsEarned = profilePoints;
  } else {
    pointsEarned = [...huntSubmissions, ...bugSubmissionsByUser].reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Top Numbers Row - Real-time Stats */}
        <UserStatsCards username={user.username} />

        {/* Three Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bug Hunts Joined */}
          <Card>
            <CardHeader>
              <CardTitle>Bug Hunts Joined</CardTitle>
              <CardDescription>All bug bounty programs you have joined</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {joinedHuntObjs.length === 0 && <li className="text-muted-foreground">No bug hunts joined yet.</li>}
                {joinedHuntObjs.map((hunt) => (
                  <li key={hunt.id}>{hunt.title}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Bugs Reported */}
          <Card>
            <CardHeader>
              <CardTitle>Bugs Reported</CardTitle>
              <CardDescription>Bugs you have reported in all hunts</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {huntSubmissions.length === 0 && <li className="text-muted-foreground">No bugs reported yet.</li>}
                {huntSubmissions.map((sub) => (
                  <li key={sub.id}>{sub.title}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Bugs Submitted */}
          <Card>
            <CardHeader>
              <CardTitle>Bugs Submitted</CardTitle>
              <CardDescription>Submissions currently under review</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {bugSubmissionsByUser.length === 0 && <li className="text-muted-foreground">No bugs submitted yet.</li>}
                {bugSubmissionsByUser.map((sub) => (
                  <li key={sub.id}>{sub.title} ({sub.status.replace(/-/g, ' ')})</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
