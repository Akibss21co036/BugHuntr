"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RankBadge } from "./rank-badge"
import type { RankTier } from "@/types/ranking"

interface PointsNotificationProps {
  points: number
  reason: string
  newRank?: RankTier
  onClose: () => void
}

export function PointsNotification({ points, reason, newRank, onClose }: PointsNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          className="fixed top-4 right-4 z-50 w-96"
        >
          <Card className="border-cyber-blue/30 bg-background/95 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyber-blue/10 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-cyber-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Points Earned!</div>
                    <div className="text-sm text-muted-foreground">{reason}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-cyber-blue/10 text-cyber-blue border-cyber-blue/20">
                        +{points} points
                      </Badge>
                      {newRank && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">New rank:</span>
                          <RankBadge rank={newRank} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsVisible(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
