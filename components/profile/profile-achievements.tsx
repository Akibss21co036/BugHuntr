"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"

interface ProfileAchievementsProps {
  badges: Array<{
    id: number
    name: string
    description: string
    icon: string
    earned: boolean
  }>
}

export function ProfileAchievements({ badges }: ProfileAchievementsProps) {
  const earnedBadges = badges.filter((badge) => badge.earned)
  const lockedBadges = badges.filter((badge) => !badge.earned)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Earned Achievements ({earnedBadges.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {earnedBadges.map((badge) => (
            <Card key={badge.id} className="border-cyber-blue/30 bg-cyber-blue/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{badge.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-cyber-blue">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                  </div>
                  <Badge className="bg-neon-green/10 text-neon-green border-neon-green/30">Earned</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Locked Achievements ({lockedBadges.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lockedBadges.map((badge) => (
            <Card key={badge.id} className="border-border/50 bg-muted/30 opacity-60">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl grayscale">{badge.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-muted-foreground">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span className="text-xs">Locked</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
