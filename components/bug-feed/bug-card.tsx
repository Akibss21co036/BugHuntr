"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Shield, Eye, Clock, DollarSign } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BugCardProps {
  bug: {
    id: number
    title: string
    severity: "critical" | "high" | "medium" | "low"
    category: string
    company: string
    summary: string
    postedTime: string
    isLocked: boolean
    author: string
    bounty?: number
    views?: number
  }
  className?: string
  index?: number
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "text-severity-critical bg-severity-critical/10 border-severity-critical"
    case "high":
      return "text-severity-high bg-severity-high/10 border-severity-high"
    case "medium":
      return "text-severity-medium bg-severity-medium/10 border-severity-medium"
    case "low":
      return "text-severity-low bg-severity-low/10 border-severity-low"
    default:
      return "text-muted-foreground bg-muted border-border"
  }
}

const getSeverityGlow = (severity: string) => {
  switch (severity) {
    case "critical":
      return "hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
    case "high":
      return "hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]"
    case "medium":
      return "hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]"
    case "low":
      return "hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]"
    default:
      return "hover:shadow-xl"
  }
}

export function BugCard({ bug, className, index = 0 }: BugCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      whileHover={{
        y: -8,
        transition: { duration: 0.2 },
      }}
      className={className}
    >
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-300 border-l-4 border-l-transparent",
          "hover:border-l-cyber-blue",
          getSeverityGlow(bug.severity),
          "transform-gpu",
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3 flex-1 min-w-0">
              <motion.div
                className="flex items-center gap-2 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <Badge className={cn(getSeverityColor(bug.severity), "font-semibold text-xs shrink-0")}>
                  {bug.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="border-cyber-blue/30 text-xs shrink-0 truncate max-w-24">
                  {bug.category}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-cyber-blue/10 text-cyber-blue text-xs shrink-0 truncate max-w-32"
                >
                  {bug.company}
                </Badge>
              </motion.div>
              <CardTitle className="text-base sm:text-lg leading-tight group-hover:text-cyber-blue transition-colors duration-200 line-clamp-2">
                {bug.title}
              </CardTitle>
            </div>
            {bug.isLocked && (
              <motion.div
                className="flex items-center gap-1 text-neon-orange bg-neon-orange/10 px-2 py-1 rounded-md shrink-0"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Shield className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Premium</span>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <CardDescription className="text-sm leading-relaxed line-clamp-3 break-words">{bug.summary}</CardDescription>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={`/placeholder.svg?height=24&width=24&query=${bug.author}`} />
                <AvatarFallback className="text-xs bg-cyber-blue/20 text-cyber-blue">
                  {bug.author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-muted-foreground truncate">@{bug.author}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
              {bug.bounty && (
                <motion.div
                  className="flex items-center gap-1 text-neon-green shrink-0"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <DollarSign className="h-3 w-3" />
                  <span className="font-semibold">{bug.bounty.toLocaleString()}</span>
                </motion.div>
              )}
              {bug.views && (
                <div className="flex items-center gap-1 shrink-0">
                  <Eye className="h-3 w-3" />
                  <span>{bug.views}</span>
                </div>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3" />
                <span className="truncate">{bug.postedTime}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
