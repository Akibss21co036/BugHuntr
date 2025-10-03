"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRanking } from "@/hooks/use-ranking"
import { RankBadge } from "@/components/ranking/rank-badge"
import { Trophy, Search, Filter, TrendingUp, Calendar, Award } from "lucide-react"
import { FadeIn } from "@/components/animations/fade-in"
import { motion } from "framer-motion"
import { db } from "@/firebaseConfig"
import { collection, getDocs, query, orderBy } from "firebase/firestore"

import { RankTier } from "@/types/ranking"

interface LeaderboardUser {
  id: string
  username: string
  points: number
  bugsSubmitted?: number
  joinedAt?: string
  rank?: RankTier
}

export default function LeaderboardPage() {
  const { userRankings } = useRanking()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRank, setFilterRank] = useState<string>("all")
  const [timeframe, setTimeframe] = useState<"all" | "monthly" | "weekly">("all")
  const [firestoreUsers, setFirestoreUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch users from Firestore
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const usersQuery = query(
          collection(db, "userProfiles"),
          orderBy("points", "desc")
        )
        const snapshot = await getDocs(usersQuery)
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          username: doc.data().username || "Unknown",
          points: doc.data().points || 0,
          bugsSubmitted: doc.data().bugsSubmitted || 0,
          joinedAt: doc.data().createdAt || new Date().toISOString(),
          rank: calculateRank(doc.data().points || 0)
        }))
        setFirestoreUsers(users)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  // Function to calculate rank based on points
  const calculateRank = (points: number): RankTier => {
    if (points >= 15000) return "S"
    if (points >= 8000) return "A"
    if (points >= 4000) return "B"
    if (points >= 1500) return "C"
    if (points >= 500) return "D"
    return "E"
  }

  // 🔎 Search + Filter - use Firestore data if available, fallback to mock data
  const usersToFilter = firestoreUsers.length > 0 ? firestoreUsers : userRankings.map(user => ({
    id: user.userId,
    username: user.username,
    points: user.totalPoints || 0,
    bugsSubmitted: user.bugsFound || 0,
    joinedAt: user.joinDate || new Date().toISOString(),
    rank: user.rank || "E"
  }))

  const filteredUsers = usersToFilter.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRank = filterRank === "all" || (user.rank ?? "") === filterRank
    return matchesSearch && matchesRank
  })

  // ✅ Sort safely by points
  const topUsers = [...filteredUsers].sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
  const podiumUsers = topUsers.slice(0, 3)
  const remainingUsers = topUsers.slice(3)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <FadeIn>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 text-cyber-blue" />
              <h1 className="text-4xl font-bold text-foreground">Leaderboard</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compete with the world's best bug hunters and climb the ranks to become a security legend.
            </p>
          </div>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search hunters..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={filterRank} onValueChange={setFilterRank}>
                    <SelectTrigger className="w-32">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="All Ranks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ranks</SelectItem>
                      <SelectItem value="S">S Rank</SelectItem>
                      <SelectItem value="A">A Rank</SelectItem>
                      <SelectItem value="B">B Rank</SelectItem>
                      <SelectItem value="C">C Rank</SelectItem>
                      <SelectItem value="D">D Rank</SelectItem>
                      <SelectItem value="E">E Rank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as typeof timeframe)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="all" className="gap-2">
              <Trophy className="w-4 h-4" />
              All Time
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2">
              <Calendar className="w-4 h-4" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Weekly
            </TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="space-y-8">
            {/* Podium */}
            {podiumUsers.length >= 3 && (
              <FadeIn delay={0.2}>
                <Card className="bg-gradient-to-br from-cyber-blue/5 to-neon-green/5 border-cyber-blue/20">
                  <CardHeader>
                    <CardTitle className="text-center flex items-center justify-center gap-2">
                      <Award className="w-6 h-6 text-cyber-blue" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 🥈 Second */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="order-2 md:order-1"
                      >
                        <div className="text-center space-y-4 p-6 rounded-lg bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                          <div className="text-6xl">🥈</div>
                          <div className="space-y-2">
                            <div className="font-bold text-lg">{podiumUsers[1]?.username}</div>
                            <div className="text-2xl font-bold text-cyber-blue">{podiumUsers[1]?.points} pts</div>
                          </div>
                        </div>
                      </motion.div>

                      {/* 🥇 First */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="order-1 md:order-2"
                      >
                        <div className="text-center space-y-4 p-6 rounded-lg bg-gradient-to-b from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50 transform md:scale-110">
                          <div className="text-8xl">🏆</div>
                          <div className="space-y-2">
                            <div className="font-bold text-xl">{podiumUsers[0]?.username}</div>
                            <div className="text-3xl font-bold text-cyber-blue">{podiumUsers[0]?.points} pts</div>
                          </div>
                        </div>
                      </motion.div>

                      {/* 🥉 Third */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="order-3"
                      >
                        <div className="text-center space-y-4 p-6 rounded-lg bg-gradient-to-b from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50">
                          <div className="text-6xl">🥉</div>
                          <div className="space-y-2">
                            <div className="font-bold text-lg">{podiumUsers[2]?.username}</div>
                            <div className="text-2xl font-bold text-cyber-blue">{podiumUsers[2]?.points} pts</div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Full Leaderboard */}
            <FadeIn delay={0.3}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyber-blue" />
                    Full Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-bold text-lg">{user.points ?? 0}</div>
                            <div className="text-sm text-muted-foreground">points</div>
                          </div>
                          {user.rank && <RankBadge rank={user.rank} size="md" />}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
