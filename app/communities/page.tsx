"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Search, Plus, Users, Lock, Globe, TrendingUp } from "lucide-react"
import { useCommunity } from "@/hooks/use-community"
import { motion } from "framer-motion"

export default function CommunitiesPage() {
  const { communities, joinedCommunities, joinCommunity, leaveCommunity, createCommunity } = useCommunity()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    isPrivate: false,
    tags: "",
  })

  const filteredCommunities = communities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim()) return

    await createCommunity({
      name: newCommunity.name,
      description: newCommunity.description,
      isPrivate: newCommunity.isPrivate,
      tags: newCommunity.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    })

    setNewCommunity({ name: "", description: "", isPrivate: false, tags: "" })
    setIsCreateDialogOpen(false)
  }

  const isJoined = (communityId: string) => {
    return joinedCommunities.some((c) => c.id === communityId)
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Communities</h1>
            <p className="text-muted-foreground">Discover and join security research communities</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Community
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Community</DialogTitle>
                <DialogDescription>Start a new community for security researchers to collaborate</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Community Name</Label>
                  <Input
                    id="name"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter community name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your community"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newCommunity.tags}
                    onChange={(e) => setNewCommunity((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="web-security, research, vulnerabilities"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="private"
                    checked={newCommunity.isPrivate}
                    onCheckedChange={(checked) => setNewCommunity((prev) => ({ ...prev, isPrivate: checked }))}
                  />
                  <Label htmlFor="private">Private Community</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateCommunity} className="flex-1">
                    Create Community
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyber-blue/10 rounded-lg">
                  <Users className="h-5 w-5 text-cyber-blue" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{communities.length}</p>
                  <p className="text-sm text-muted-foreground">Total Communities</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neon-green/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-neon-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{joinedCommunities.length}</p>
                  <p className="text-sm text-muted-foreground">Joined Communities</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyber-cyan/10 rounded-lg">
                  <Globe className="h-5 w-5 text-cyber-cyan" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{communities.filter((c) => !c.isPrivate).length}</p>
                  <p className="text-sm text-muted-foreground">Public Communities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community, index) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={community.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-cyber-blue to-neon-green text-white font-bold">
                          {community.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {community.name}
                          {community.isPrivate ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {community.memberCount} members
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-3">{community.description}</CardDescription>

                  <div className="flex flex-wrap gap-1">
                    {community.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {community.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{community.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="pt-2">
                    {isJoined(community.id) ? (
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => leaveCommunity(community.id)}
                      >
                        Leave Community
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={() => joinCommunity(community.id)}>
                        Join Community
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredCommunities.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No communities found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Be the first to create a community!"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Community
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
