"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRanking } from "@/hooks/use-ranking"
import { useAuth } from "@/components/auth/auth-context"
import { Bug, AlertTriangle, Flame, Coins, Crown, Target, Trophy, Lock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Achievement } from "@/types/ranking"

const iconMap = {
  bug: Bug,
  "alert-triangle": AlertTriangle,
  flame: Flame,
  coins: Coins,
  crown: Crown,
  target: Target,
}

export function AchievementsDisplay() {
  const { user } = useAuth()
  const { getUserRanking, getUserAchievements, ACHIEVEMENTS } = useRanking()

  if (!user) return null

  const userRanking = getUserRanking(user.id)
  const userAchievements = getUserAchievements(user.id)

  const unlockedAchievements = ACHIEVEMENTS.filter((achievement) =>
    userAchievements.some((ua) => ua.achievementId === achievement.id),
  )

  const lockedAchievements = ACHIEVEMENTS.filter(
    (achievement) => !userAchievements.some((ua) => ua.achievementId === achievement.id),
  )

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      case "rare":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "epic":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "legendary":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getProgress = (achievement: Achievement): number => {
    if (!userRanking) return 0

    switch (achievement.requirement.type) {
      case "points":
        return Math.min(100, (userRanking.totalPoints / (achievement.requirement.value as number)) * 100)
      case "bugs":
        return Math.min(100, (userRanking.bugsFound / (achievement.requirement.value as number)) * 100)
      case "streak":
        return Math.min(100, (userRanking.streak / (achievement.requirement.value as number)) * 100)
      case "rank":
        const rankOrder = ["E", "D", "C", "B", "A", "S"]
        const currentIndex = rankOrder.indexOf(userRanking.rank)
        const requiredIndex = rankOrder.indexOf(achievement.requirement.value as string)
        return currentIndex >= requiredIndex ? 100 : (currentIndex / requiredIndex) * 100
      default:
        return 0
    }
  }

  const AchievementCard = ({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) => {
    const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy
    const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id)
    const progress = getProgress(achievement)

    return (
      <Card
        className={`transition-all duration-200 ${unlocked ? "bg-cyber-blue/5 border-cyber-blue/20" : "opacity-60"}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  unlocked ? "bg-cyber-blue/10" : "bg-muted"
                }`}
              >
                {unlocked ? (
                  <IconComponent className="w-5 h-5 text-cyber-blue" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">{achievement.name}</CardTitle>
                <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                  {achievement.rarity}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-neon-green">+{achievement.pointsReward}</div>
              <div className="text-xs text-muted-foreground">points</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{achievement.description}</p>

          {unlocked && userAchievement ? (
            <div className="text-xs text-cyber-blue">
              Unlocked {formatDistanceToNow(new Date(userAchievement.unlockedAt), { addSuffix: true })}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Achievements</h2>
        <p className="text-muted-foreground">Track your progress and unlock rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyber-blue">{unlockedAchievements.length}</div>
            <div className="text-sm text-muted-foreground">Unlocked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{lockedAchievements.length}</div>
            <div className="text-sm text-muted-foreground">Locked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-neon-green">
              {unlockedAchievements.reduce((sum, ach) => sum + ach.pointsReward, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Bonus Points</div>
          </CardContent>
        </Card>
      </div>

      {unlockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Unlocked Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} unlocked={true} />
            ))}
          </div>
        </div>
      )}

      {lockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Locked Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} unlocked={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
