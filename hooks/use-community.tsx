"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext, useMemo } from "react"
import type { Community, CommunityChannel, CommunityMember, CommunityMessage } from "@/types/community"
import { db } from "@/firebaseConfig"
import { useAuth } from "@/components/auth/auth-context"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"

interface CommunityContextType {
  communities: Community[]
  currentCommunity: Community | null
  communityMembers: CommunityMember[]
  communityMessages: CommunityMessage[]
  joinedCommunities: Community[]
  joinedCommunityIds: string[]
  isLoading: boolean

  // Actions
  setCurrentCommunity: (community: Community | null) => void
  joinCommunity: (communityId: string) => Promise<void>
  leaveCommunity: (communityId: string) => Promise<void>
  createCommunity: (communityData: Partial<Community>) => Promise<Community>
  createChannel: (
    communityId: string,
    channelData: Pick<CommunityChannel, "name" | "description" | "type" | "isPrivate">,
  ) => Promise<CommunityChannel>
  updateCommunity: (communityId: string, updates: Partial<Community>) => Promise<void>
  sendMessage: (channelId: string, content: string) => Promise<void>
  getChannelMessages: (channelId: string) => CommunityMessage[]
  getUserRole: (communityId: string, userId: string) => string | null
  getCommunityChannels: (communityId: string) => CommunityChannel[]
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined)

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (context === undefined) {
    throw new Error("useCommunity must be used within a CommunityProvider")
  }
  return context
}

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [communities, setCommunities] = useState<Community[]>([])
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null)
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([])
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([])
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([])
  const [channelMap, setChannelMap] = useState<Record<string, CommunityChannel[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  const toIso = (value: any): string => {
    if (!value) return new Date().toISOString()
    if (typeof value === "string") return value
    if (typeof value?.toDate === "function") return value.toDate().toISOString()
    return new Date(value).toISOString()
  }

  const mapCommunity = (id: string, data: any, channels: CommunityChannel[]): Community => {
    const isPrivate =
      typeof data.isPrivate === "boolean"
        ? data.isPrivate
        : data.type === "private"
    const memberCount = Number(data.memberCount ?? data.membersCount ?? 0)

    return {
      id,
      name: data.name ?? "Unnamed Community",
      description: data.description ?? "",
      avatar: data.avatar,
      banner: data.banner,
      isPrivate,
      memberCount,
      createdAt: toIso(data.createdAt),
      ownerId: data.ownerId ?? "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      channels,
    }
  }

  const buildDefaultChannels = (createdAt: string): CommunityChannel[] => [
    {
      id: "general",
      name: "general",
      type: "text",
      description: "General bug solving discussion",
      isPrivate: false,
      memberIds: [],
      createdAt,
    },
    {
      id: "frontend",
      name: "frontend",
      type: "text",
      description: "Frontend bugs and fixes",
      isPrivate: false,
      memberIds: [],
      createdAt,
    },
    {
      id: "backend",
      name: "backend",
      type: "text",
      description: "Backend debugging and architecture",
      isPrivate: false,
      memberIds: [],
      createdAt,
    },
    {
      id: "security",
      name: "security",
      type: "text",
      description: "Security triage and exploit mitigation",
      isPrivate: false,
      memberIds: [],
      createdAt,
    },
  ]

  const ensureDefaultChannels = async (communityId: string) => {
    const channelsRef = collection(db, "communities", communityId, "channels")
    const existingChannels = await getDocs(query(channelsRef, limit(1)))
    if (!existingChannels.empty) return

    const defaults = buildDefaultChannels(new Date().toISOString())
    for (const channel of defaults) {
      await setDoc(doc(db, "communities", communityId, "channels", channel.id), {
        ...channel,
        createdAt: serverTimestamp(),
      })
    }

    await updateDoc(doc(db, "communities", communityId), {
      channelCount: defaults.length,
      updatedAt: serverTimestamp(),
    }).catch(() => null)
  }

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "communities"), (snapshot) => {
      setCommunities((prev) => {
        const next = snapshot.docs.map((communityDoc) => {
          const fallbackChannels = prev.find((p) => p.id === communityDoc.id)?.channels ?? []
          const channels = channelMap[communityDoc.id] ?? fallbackChannels
          return mapCommunity(communityDoc.id, communityDoc.data(), channels)
        })
        return next
      })
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [channelMap])

  useEffect(() => {
    if (!user?.id) {
      setJoinedCommunityIds([])
      setIsLoading(false)
      return
    }

    const membershipQuery = query(collection(db, "community_memberships"), where("userId", "==", user.id))
    const unsubscribe = onSnapshot(membershipQuery, (snapshot) => {
      const ids = snapshot.docs.map((membershipDoc) => String(membershipDoc.data().communityId))
      setJoinedCommunityIds(ids)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user?.id])

  useEffect(() => {
    if (joinedCommunityIds.length === 0) {
      setChannelMap({})
      return
    }

    const unsubscribers = joinedCommunityIds.map((communityId) =>
      onSnapshot(collection(db, "communities", communityId, "channels"), (snapshot) => {
        const channels: CommunityChannel[] = snapshot.docs.map((channelDoc) => {
          const data = channelDoc.data()
          return {
            id: channelDoc.id,
            name: data.name ?? "general",
            type: data.type ?? "text",
            description: data.description,
            isPrivate: Boolean(data.isPrivate),
            memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
            createdAt: toIso(data.createdAt),
          }
        })

        setChannelMap((prev) => ({ ...prev, [communityId]: channels }))
      }),
    )

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [joinedCommunityIds.join("|")])

  useEffect(() => {
    if (joinedCommunityIds.length === 0) return

    Promise.all(joinedCommunityIds.map((communityId) => ensureDefaultChannels(communityId))).catch(() => null)
  }, [joinedCommunityIds.join("|")])

  useEffect(() => {
    if (!currentCommunity?.id) {
      setCommunityMembers([])
      return
    }

    const unsubscribe = onSnapshot(collection(db, "communities", currentCommunity.id, "members"), (snapshot) => {
      const members: CommunityMember[] = snapshot.docs.map((memberDoc) => {
        const data = memberDoc.data()
        return {
          id: memberDoc.id,
          userId: data.userId ?? memberDoc.id,
          username: data.username ?? "Anonymous",
          avatar: data.avatar,
          role: data.role ?? "member",
          joinedAt: toIso(data.joinedAt),
          isOnline: Boolean(data.isOnline),
          permissions: Array.isArray(data.permissions) ? data.permissions : [],
          reputation: Number(data.reputation ?? 0),
          skills: Array.isArray(data.skills) ? data.skills : [],
        }
      })

      setCommunityMembers(members)
    })

    return () => unsubscribe()
  }, [currentCommunity?.id])

  const joinedCommunities = useMemo(
    () => communities.filter((community) => joinedCommunityIds.includes(community.id)),
    [communities, joinedCommunityIds],
  )

  useEffect(() => {
    if (currentCommunity && joinedCommunityIds.includes(currentCommunity.id)) return
    if (joinedCommunities.length > 0) {
      setCurrentCommunity(joinedCommunities[0])
      return
    }
    setCurrentCommunity(null)
  }, [joinedCommunities, joinedCommunityIds.join("|"), currentCommunity?.id])

  const joinCommunity = async (communityId: string) => {
    if (!user?.id) return

    await ensureDefaultChannels(communityId)

    const membershipId = `${communityId}_${user.id}`
    const membershipRef = doc(db, "community_memberships", membershipId)
    const membershipSnapshot = await getDoc(membershipRef)
    if (membershipSnapshot.exists()) return

    await setDoc(membershipRef, {
      communityId,
      userId: user.id,
      username: user.username,
      joinedAt: serverTimestamp(),
      role: "member",
    })

    await setDoc(
      doc(db, "communities", communityId, "members", user.id),
      {
        userId: user.id,
        username: user.username,
        role: "member",
        joinedAt: serverTimestamp(),
        isOnline: true,
        permissions: ["comment", "create_thread"],
        reputation: 0,
        skills: [],
      },
      { merge: true },
    )

    await updateDoc(doc(db, "communities", communityId), {
      memberCount: increment(1),
      membersCount: increment(1),
      updatedAt: serverTimestamp(),
    }).catch(() => null)
  }

  const leaveCommunity = async (communityId: string) => {
    if (!user?.id) return

    const membershipId = `${communityId}_${user.id}`
    await deleteDoc(doc(db, "community_memberships", membershipId)).catch(() => null)
    await deleteDoc(doc(db, "communities", communityId, "members", user.id)).catch(() => null)
    await updateDoc(doc(db, "communities", communityId), {
      memberCount: increment(-1),
      membersCount: increment(-1),
      updatedAt: serverTimestamp(),
    }).catch(() => null)

    if (currentCommunity?.id === communityId) setCurrentCommunity(null)
  }

  const createCommunity = async (communityData: Partial<Community>): Promise<Community> => {
    if (!user?.id) {
      throw new Error("You must be logged in to create a community")
    }

    const createdAt = new Date().toISOString()
    const defaultChannels: CommunityChannel[] = buildDefaultChannels(createdAt)

    const communityRef = await addDoc(collection(db, "communities"), {
      name: communityData.name || "New Community",
      description: communityData.description || "",
      isPrivate: communityData.isPrivate || false,
      type: communityData.isPrivate ? "private" : "public",
      memberCount: 0,
      membersCount: 0,
      channelCount: defaultChannels.length,
      createdAt: serverTimestamp(),
      ownerId: user.id,
      tags: communityData.tags || [],
      projects: [],
      avatar: communityData.avatar || "",
      banner: communityData.banner || "",
    })

    for (const channel of defaultChannels) {
      await setDoc(doc(db, "communities", communityRef.id, "channels", channel.id), {
        ...channel,
        createdAt: serverTimestamp(),
      })
    }

    await joinCommunity(communityRef.id)
    await setDoc(
      doc(db, "community_memberships", `${communityRef.id}_${user.id}`),
      {
        communityId: communityRef.id,
        userId: user.id,
        username: user.username,
        joinedAt: serverTimestamp(),
        role: "owner",
      },
      { merge: true },
    )

    await setDoc(
      doc(db, "communities", communityRef.id, "members", user.id),
      {
        userId: user.id,
        username: user.username,
        role: "owner",
        joinedAt: serverTimestamp(),
        isOnline: true,
        permissions: ["manage_community", "manage_channels", "manage_members", "moderate_messages"],
        reputation: 25,
        skills: [],
      },
      { merge: true },
    )

    const newCommunity: Community = {
      id: communityRef.id,
      name: communityData.name || "New Community",
      description: communityData.description || "",
      isPrivate: communityData.isPrivate || false,
      memberCount: 1,
      createdAt,
      ownerId: user.id,
      tags: communityData.tags || [],
      projects: [],
      channels: defaultChannels,
    }

    return newCommunity
  }

  const createChannel = async (
    communityId: string,
    channelData: Pick<CommunityChannel, "name" | "description" | "type" | "isPrivate">,
  ): Promise<CommunityChannel> => {
    const channelId = channelData.name.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-")
    const channel: CommunityChannel = {
      id: channelId,
      name: channelData.name,
      description: channelData.description,
      type: channelData.type,
      isPrivate: channelData.isPrivate,
      memberIds: [],
      createdAt: new Date().toISOString(),
    }

    await setDoc(doc(db, "communities", communityId, "channels", channel.id), {
      ...channel,
      createdAt: serverTimestamp(),
    })

    await updateDoc(doc(db, "communities", communityId), {
      channelCount: increment(1),
      updatedAt: serverTimestamp(),
    }).catch(() => null)

    return channel
  }

  const updateCommunity = async (communityId: string, updates: Partial<Community>) => {
    await updateDoc(doc(db, "communities", communityId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }

  const sendMessage = async (channelId: string, content: string) => {
    if (!user?.id || !currentCommunity?.id || !content.trim()) return

    const newMessage: CommunityMessage = {
      id: Date.now().toString(),
      channelId,
      userId: user.id,
      username: user.username,
      content,
      timestamp: new Date().toISOString(),
    }

    await addDoc(collection(db, "communities", currentCommunity.id, "channels", channelId, "messages"), {
      ...newMessage,
      timestamp: serverTimestamp(),
    })

    setCommunityMessages((prev) => [...prev, newMessage])
  }

  const getChannelMessages = (channelId: string) => {
    return communityMessages.filter((msg) => msg.channelId === channelId)
  }

  const getUserRole = (communityId: string, userId: string) => {
    const member = communityMembers.find(
      (m) => m.userId === userId && joinedCommunityIds.includes(communityId),
    )
    return member?.role || null
  }

  const getCommunityChannels = (communityId: string) => channelMap[communityId] ?? []

  const value: CommunityContextType = {
    communities,
    currentCommunity,
    communityMembers,
    communityMessages,
    joinedCommunities,
    joinedCommunityIds,
    isLoading,
    setCurrentCommunity,
    joinCommunity,
    leaveCommunity,
    createCommunity,
    createChannel,
    updateCommunity,
    sendMessage,
    getChannelMessages,
    getUserRole,
    getCommunityChannels,
  }

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}
