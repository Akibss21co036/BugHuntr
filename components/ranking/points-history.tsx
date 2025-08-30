"use client"

import { useRanking } from "@/hooks/use-ranking"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PointsHistoryProps {
  userId: string
  limit?: number
}

export function PointsHistory({ userId, limit }: PointsHistoryProps) {
  const { pointsTransactions } = useRanking()

  const userTransactions = pointsTransactions
    .filter((transaction) => transaction.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)

  if (userTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyber-blue" />
            Points History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No points earned yet</p>
            <p className="text-sm">Submit your first bug report to start earning points!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-cyber-blue" />
          Points History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyber-blue/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-cyber-blue" />
                </div>
                <div>
                  <div className="font-medium text-sm">{transaction.reason}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                +{transaction.points}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
