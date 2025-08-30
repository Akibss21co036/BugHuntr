import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RankBadge } from "./rank-badge"
import { useRanking } from "@/hooks/use-ranking"
import type { UserRanking } from "@/types/ranking"
import { TrendingUp, AlertTriangle, Trophy } from "lucide-react"

interface RankProgressProps {
  user: UserRanking
}

export function RankProgress({ user }: RankProgressProps) {
  const { getRankBenefits, getWeeklyRequirement, isRankAtRisk, calculateAdvancedRanking } = useRanking()

  const benefits = getRankBenefits(user.rank)
  const weeklyReq = getWeeklyRequirement(user.rank)
  const atRisk = isRankAtRisk(user)
  const metrics = calculateAdvancedRanking(user, [])

  return (
    <div className="space-y-6">
      {/* Current Rank Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyber-blue" />
            Rank Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RankBadge rank={user.rank} size="lg" />
              <div>
                <div className="font-semibold">{user.rank} Rank</div>
                <div className="text-sm text-muted-foreground">{user.totalPoints.toLocaleString()} total points</div>
              </div>
            </div>
            {atRisk && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                At Risk
              </Badge>
            )}
          </div>

          {user.rank !== "S" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to next rank</span>
                <span>{user.nextRankPoints} points needed</span>
              </div>
              <Progress value={user.rankProgress} className="h-2" />
            </div>
          )}

          {weeklyReq > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly requirement</span>
                <span className={user.weeklyPoints >= weeklyReq ? "text-green-500" : "text-orange-500"}>
                  {user.weeklyPoints}/{weeklyReq} points
                </span>
              </div>
              <Progress value={(user.weeklyPoints / weeklyReq) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyber-blue" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Points Score</div>
              <div className="font-semibold">{Math.round(metrics.pointsWeight)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Activity Score</div>
              <div className="font-semibold">{Math.round(metrics.activityWeight)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Consistency Score</div>
              <div className="font-semibold">{Math.round(metrics.consistencyWeight)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Quality Score</div>
              <div className="font-semibold">{Math.round(metrics.qualityWeight)}</div>
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between font-semibold">
              <span>Total Score</span>
              <span className="text-cyber-blue">{Math.round(metrics.totalScore)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rank Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Rank Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-cyber-blue rounded-full flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
