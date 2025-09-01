"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, Clock, Users, MessageSquare, DollarSign, Trash2 } from "lucide-react"
import type { BugHunt } from "@/types/bug-hunt"
import { BugHuntSubmissionModal } from "./bug-hunt-submission-modal"
import { useBugHunt } from "@/hooks/use-bug-hunt"
import { useAuth } from "@/components/auth/auth-context"

interface BugHuntCardProps {
  hunt: BugHunt
  index: number
}

export function BugHuntCard({ hunt, index }: BugHuntCardProps) {
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const { removeBugHunt } = useBugHunt()
  const { user } = useAuth()
  const { joinHunt, isJoinedToHunt } = require("@/hooks/use-user-hunts").useUserHunts ? require("@/hooks/use-user-hunts").useUserHunts() : {};

  const isAdmin = user?.role === "admin"

  const daysRemaining = Math.ceil((new Date(hunt.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  // Show progress based on participants if needed
  const progressPercentage = hunt.maxParticipants ? (hunt.currentParticipants / hunt.maxParticipants) * 100 : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-neon-green text-black"
      case "upcoming":
        return "bg-cyber-blue text-white"
      case "ended":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleRemoveHunt = async () => {
    if (!isAdmin) return

    if (!confirm("Are you sure you want to remove this bug hunt? This action cannot be undone.")) {
      return
    }

    setIsRemoving(true)
    try {
      console.log("[v0] Admin removing hunt:", hunt.id)
      await removeBugHunt(hunt.id)
      console.log("[v0] Hunt removal completed")
    } catch (error) {
      console.error("[v0] Failed to remove hunt:", error)
      alert("Failed to remove bug hunt. Please try again.")
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card className="h-full hover:shadow-lg transition-all duration-300 border-cyber-blue/20 hover:border-cyber-blue/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-tight mb-2">{hunt.title}</h3>
                <Badge className={getStatusColor(hunt.status)}>
                  {hunt.status.charAt(0).toUpperCase() + hunt.status.slice(1)}
                </Badge>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span>{hunt.rewards?.critical ? hunt.rewards.critical : 0} pts</span>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRemoveHunt}
                    disabled={isRemoving}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-2">{hunt.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-cyber-blue" />
                <span className="text-muted-foreground">Scope</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{hunt.scope?.length || 0} targets</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyber-orange" />
                <span className="text-muted-foreground">Time left</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-cyber-orange">
                  {daysRemaining > 0 ? `${daysRemaining} days` : "Ended"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyber-purple" />
                <span className="text-muted-foreground">Participants</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{hunt.currentParticipants || 0}</span>
              </div>
            </div>

            {hunt.maxParticipants && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Participants</span>
                  <span className="font-medium">
                    {hunt.currentParticipants || 0}/{hunt.maxParticipants || 0}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {!isJoinedToHunt(hunt.id) ? (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => joinHunt(hunt.id)}
                  disabled={hunt.status !== "active"}
                >
                  Join Bug Hunt
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowSubmissionModal(true)}
                  disabled={hunt.status !== "active"}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Submit Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <BugHuntSubmissionModal hunt={hunt} isOpen={showSubmissionModal} onClose={() => setShowSubmissionModal(false)} />
    </>
  )
}
