"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Shield,
  Eye,
  Clock,
  DollarSign,
  Lock,
  Unlock,
  Calendar,
  Tag,
  AlertTriangle,
  FileText,
  TimerIcon as Timeline,
} from "lucide-react"

interface BugDetailsContentProps {
  bug: {
    id: number
    title: string
    severity: "critical" | "high" | "medium" | "low"
    category: string
    company: string
    description: string
    postedTime: string
    isLocked: boolean
    author: string
    bounty: number
    views: number
    poc: string
    timeline: Array<{ date: string; event: string }>
    tags: string[]
    cvss: string
    cwe: string
  }
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

export function BugDetailsContent({ bug }: BugDetailsContentProps) {
  const router = useRouter()
  const [isSubscribed, setIsSubscribed] = useState(!bug.isLocked)

  const handleSubscribe = () => {
    setIsSubscribed(true)
    // In a real app, this would make an API call to subscribe the user
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/")}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back to Bug Feed</span>
        <span className="sm:hidden">Back</span>
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn(getSeverityColor(bug.severity), "shrink-0")}>{bug.severity.toUpperCase()}</Badge>
                  <Badge variant="outline" className="shrink-0 truncate max-w-24">
                    {bug.category}
                  </Badge>
                  <Badge variant="secondary" className="bg-cyber-blue/10 text-cyber-blue shrink-0 truncate max-w-32">
                    {bug.company}
                  </Badge>
                  <Badge variant="outline" className="gap-1 shrink-0">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="hidden sm:inline">CVSS</span> {bug.cvss}
                  </Badge>
                  <Badge variant="outline" className="shrink-0">
                    {bug.cwe}
                  </Badge>
                </div>
                <CardTitle className="text-xl sm:text-2xl leading-tight break-words">{bug.title}</CardTitle>
              </div>
              {bug.isLocked && !isSubscribed && (
                <div className="flex items-center gap-1 text-neon-orange bg-neon-orange/10 px-3 py-2 rounded-lg shrink-0">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Premium</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border/50">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={`/placeholder.svg?height=32&width=32&query=${bug.author}`} />
                  <AvatarFallback className="bg-cyber-blue/20 text-cyber-blue">
                    {bug.author.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium truncate">@{bug.author}</div>
                  <div className="text-sm text-muted-foreground">Security Researcher</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1 text-neon-green shrink-0">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">${bug.bounty.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Eye className="h-4 w-4" />
                  <span>{bug.views}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="h-4 w-4" />
                  <span className="truncate">{bug.postedTime}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="description" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="description" className="gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Description</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="poc" className="gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            {bug.isLocked && !isSubscribed ? (
              <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Unlock className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">Proof of Concept</span>
            <span className="sm:hidden">PoC</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Timeline className="h-3 w-3 sm:h-4 sm:w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {bug.description.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed break-words">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="poc">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Proof of Concept
                {bug.isLocked && !isSubscribed && <Lock className="h-5 w-5 text-neon-orange" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bug.isLocked && !isSubscribed ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-neon-orange/10 rounded-full flex items-center justify-center">
                    <Lock className="h-8 w-8 text-neon-orange" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
                    <p className="text-muted-foreground mb-4 break-words">
                      Subscribe to unlock detailed proof of concept and exploitation steps.
                    </p>
                    <Button onClick={handleSubscribe} className="gap-2">
                      <Shield className="h-4 w-4" />
                      Subscribe to Unlock
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap break-words bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {bug.poc}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Disclosure Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bug.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-3 h-3 bg-cyber-blue rounded-full"></div>
                      {index < bug.timeline.length - 1 && <div className="w-px h-8 bg-border mt-2"></div>}
                    </div>
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{item.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground break-words">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Tags & Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {bug.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-cyber-blue/10 text-cyber-blue text-xs truncate max-w-32"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
