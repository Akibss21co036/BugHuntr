"use client"

import { useParams } from "next/navigation"
import { useCommunity } from "@/hooks/use-community"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Users, Calendar, Target, TrendingUp, MessageSquare, Hash } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function CommunityPage() {
  const params = useParams()
  const communityId = params.id as string
  const { communities, setCurrentCommunity } = useCommunity()

  const community = communities.find((c) => c.id === communityId)

  if (!community) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Community not found</h1>
          <Link href="/communities">
            <Button>Browse Communities</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Set as current community when viewing
  if (community) {
    setCurrentCommunity(community)
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Community Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          {community.banner && <div className="h-48 rounded-lg bg-gradient-to-r from-cyber-blue to-neon-green mb-6" />}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={community.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-cyber-blue to-neon-green text-white text-2xl font-bold">
                {community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{community.name}</h1>
              <p className="text-muted-foreground mb-4">{community.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {community.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {community.memberCount} members
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {new Date(community.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Projects
                </CardTitle>
                <CardDescription>Current security research projects in this community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {community.projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </div>
                      <Badge
                        variant={
                          project.priority === "critical"
                            ? "destructive"
                            : project.priority === "high"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {project.priority}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {project.assignedMembers.length}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>SE</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">SecurityExpert</span> updated project progress
                      </p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>WH</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">WebHacker</span> shared a new vulnerability
                      </p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Channels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {community.channels.map((channel) => (
                  <Link key={channel.id} href={`/community/${community.id}/channel/${channel.id}`}>
                    <Button variant="ghost" className="w-full justify-start gap-2 h-8">
                      <Hash className="h-3 w-3" />
                      {channel.name}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Members</span>
                  <span className="font-medium">{community.memberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Projects</span>
                  <span className="font-medium">{community.projects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Channels</span>
                  <span className="font-medium">{community.channels.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
