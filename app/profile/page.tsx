"use client"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileStats } from "@/components/profile/profile-stats"
import { ProfileAchievements } from "@/components/profile/profile-achievements"
import { ProfileActivity } from "@/components/profile/profile-activity"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth/auth-context"
import { useRanking } from "@/hooks/use-ranking"
import { RankProgress } from "@/components/ranking/rank-progress"
import { PointsHistory } from "@/components/ranking/points-history"

const mockUserProfile = {
  id: 1,
  username: "security_researcher_01",
  displayName: "Alex Chen",
  bio: "Cybersecurity researcher specializing in web application security and API vulnerabilities. 5+ years of experience in ethical hacking and penetration testing.",
  avatar: "/placeholder.svg?height=120&width=120",
  joinDate: "January 2022",
  location: "San Francisco, CA",
  website: "https://alexchen.security",
  rank: 247,
  totalEarnings: 12450,
  totalReports: 23,
  validReports: 19,
  duplicateReports: 4,
  averageBounty: 655,
  reputation: 4.8,
  badges: [
    { id: 1, name: "First Blood", description: "First vulnerability reported", icon: "🩸", earned: true },
    { id: 2, name: "Critical Hunter", description: "Found 5+ critical vulnerabilities", icon: "🎯", earned: true },
    { id: 3, name: "Web Expert", description: "Specialized in web application security", icon: "🌐", earned: true },
    { id: 4, name: "API Master", description: "Expert in API security testing", icon: "🔌", earned: true },
    { id: 5, name: "Hall of Fame", description: "Featured in company hall of fame", icon: "🏆", earned: false },
    { id: 6, name: "Bug Bounty Legend", description: "Earned $50,000+ in bounties", icon: "💎", earned: false },
  ],
  recentActivity: [
    {
      id: 1,
      type: "report",
      title: "SQL Injection in User Authentication",
      company: "TechCorp",
      bounty: 5000,
      date: "2 hours ago",
      status: "accepted",
    },
    {
      id: 2,
      type: "certificate",
      title: "Web Application Security Certificate",
      company: "SecurityCorp",
      date: "1 week ago",
      status: "issued",
    },
    {
      id: 3,
      type: "report",
      title: "XSS in Comment System",
      company: "SocialApp",
      bounty: 2500,
      date: "2 weeks ago",
      status: "accepted",
    },
  ],
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { getUserRanking } = useRanking()

  // Get current user's ranking data
  const userRanking = user ? getUserRanking(user.id) : null

  return (
    <main className="p-6 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <ProfileHeader user={mockUserProfile} userRanking={userRanking} />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProfileStats user={mockUserProfile} />
          </TabsContent>

          <TabsContent value="ranking">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                {userRanking ? (
                  <RankProgress user={userRanking} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Please log in to view your ranking progress.</p>
                  </div>
                )}
              </div>
              <div>
                {user ? (
                  <PointsHistory userId={user.id} limit={10} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Please log in to view your points history.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <ProfileAchievements badges={mockUserProfile.badges} />
          </TabsContent>

          <TabsContent value="activity">
            <ProfileActivity activities={mockUserProfile.recentActivity} />
          </TabsContent>

          <TabsContent value="certificates">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Certificate management coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
