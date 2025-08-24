"use client"

import { useRanking } from "@/hooks/use-ranking"
import { RankBadge } from "./rank-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LeaderboardProps {
  limit?: number
  showFullStats?: boolean
}

export function Leaderboard({ limit = 10, showFullStats = true }: LeaderboardProps) {
  const { getLeaderboard } = useRanking()
  const topUsers = getLeaderboard(limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">🏆 Top Bug Hunters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topUsers.map((user, index) => (
            <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{user.username}</div>
                  {showFullStats && (
                    <div className="text-sm text-muted-foreground">
                      {user.bugsFound} bugs found • ${user.totalEarnings.toLocaleString()} earned
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-lg">{user.totalPoints.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">points</div>
                </div>
                <RankBadge rank={user.rank} size="md" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
