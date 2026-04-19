"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useCommunity } from "@/hooks/use-community"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CommunityOverviewPage() {
  const params = useParams<{ communityId: string }>()
  const communityId = typeof params?.communityId === "string" ? params.communityId : ""

  const { communities, joinedCommunityIds, getCommunityChannels, joinCommunity } = useCommunity()
  const community = useMemo(
    () => communities.find((item) => item.id === communityId) ?? null,
    [communities, communityId],
  )

  const channels = getCommunityChannels(communityId)
  const hasJoined = joinedCommunityIds.includes(communityId)

  if (!community) {
    return (
      <main className="p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Community not found.</CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="p-6 space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{community.name}</h1>
        <p className="text-muted-foreground">{community.description}</p>
        <div className="flex flex-wrap gap-2">
          {community.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      {!hasJoined && <Button onClick={() => joinCommunity(community.id)}>Join Community</Button>}

      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {channels.map((channel) => (
            <Link key={channel.id} href={`/communities/${community.id}/channels/${channel.id}`}>
              <div className="rounded-lg border border-border p-4 hover:border-cyan-400/50 transition-colors">
                <p className="font-semibold">#{channel.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{channel.description || "Discussion channel"}</p>
              </div>
            </Link>
          ))}

          {channels.length === 0 && (
            <p className="text-sm text-muted-foreground">No channels available yet.</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
