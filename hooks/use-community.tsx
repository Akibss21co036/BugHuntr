"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import type { Community, CommunityMember, CommunityMessage } from "@/types/community"
import { mockCommunities, mockCommunityMembers, mockCommunityMessages } from "@/data/mock-communities"

interface CommunityContextType {
  communities: Community[]
  currentCommunity: Community | null
  communityMembers: CommunityMember[]
  communityMessages: CommunityMessage[]
  joinedCommunities: Community[]
  isLoading: boolean

  // Actions
  setCurrentCommunity: (community: Community | null) => void
  joinCommunity: (communityId: string) => Promise<void>
  leaveCommunity: (communityId: string) => Promise<void>
  createCommunity: (communityData: Partial<Community>) => Promise<Community>
  updateCommunity: (communityId: string, updates: Partial<Community>) => Promise<void>
  sendMessage: (channelId: string, content: string) => Promise<void>
  getChannelMessages: (channelId: string) => CommunityMessage[]
  getUserRole: (communityId: string, userId: string) => string | null
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
  const [communities, setCommunities] = useState<Community[]>([])
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null)
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([])
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([])
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load initial data
    setCommunities(mockCommunities)
    setCommunityMembers(mockCommunityMembers)
    setCommunityMessages(mockCommunityMessages)

    // Load user's joined communities from localStorage
    const savedJoinedCommunities = localStorage.getItem("joinedCommunities")
    if (savedJoinedCommunities) {
      const joinedIds = JSON.parse(savedJoinedCommunities)
      const joined = mockCommunities.filter((c) => joinedIds.includes(c.id))
      setJoinedCommunities(joined)
    } else {
      // Default: join first community
      setJoinedCommunities([mockCommunities[0]])
      localStorage.setItem("joinedCommunities", JSON.stringify([mockCommunities[0].id]))
    }

    setIsLoading(false)
  }, [])

  const joinCommunity = async (communityId: string) => {
    const community = communities.find((c) => c.id === communityId)
    if (community && !joinedCommunities.find((c) => c.id === communityId)) {
      const updated = [...joinedCommunities, community]
      setJoinedCommunities(updated)
      localStorage.setItem("joinedCommunities", JSON.stringify(updated.map((c) => c.id)))
    }
  }

  const leaveCommunity = async (communityId: string) => {
    const updated = joinedCommunities.filter((c) => c.id !== communityId)
    setJoinedCommunities(updated)
    localStorage.setItem("joinedCommunities", JSON.stringify(updated.map((c) => c.id)))

    if (currentCommunity?.id === communityId) {
      setCurrentCommunity(null)
    }
  }

  const createCommunity = async (communityData: Partial<Community>): Promise<Community> => {
    const newCommunity: Community = {
      id: Date.now().toString(),
      name: communityData.name || "New Community",
      description: communityData.description || "",
      isPrivate: communityData.isPrivate || false,
      memberCount: 1,
      createdAt: new Date().toISOString(),
      ownerId: "current-user", // Replace with actual user ID
      tags: communityData.tags || [],
      projects: [],
      channels: [
        {
          id: "general",
          name: "general",
          type: "text",
          description: "General discussion",
          isPrivate: false,
          memberIds: [],
          createdAt: new Date().toISOString(),
        },
      ],
    }

    setCommunities((prev) => [...prev, newCommunity])
    await joinCommunity(newCommunity.id)
    return newCommunity
  }

  const updateCommunity = async (communityId: string, updates: Partial<Community>) => {
    setCommunities((prev) => prev.map((c) => (c.id === communityId ? { ...c, ...updates } : c)))

    if (currentCommunity?.id === communityId) {
      setCurrentCommunity((prev) => (prev ? { ...prev, ...updates } : null))
    }
  }

  const sendMessage = async (channelId: string, content: string) => {
    const newMessage: CommunityMessage = {
      id: Date.now().toString(),
      channelId,
      userId: "current-user", // Replace with actual user ID
      username: "Current User", // Replace with actual username
      content,
      timestamp: new Date().toISOString(),
    }

    setCommunityMessages((prev) => [...prev, newMessage])
  }

  const getChannelMessages = (channelId: string) => {
    return communityMessages.filter((msg) => msg.channelId === channelId)
  }

  const getUserRole = (communityId: string, userId: string) => {
    const member = communityMembers.find(
      (m) => m.userId === userId && joinedCommunities.some((c) => c.id === communityId),
    )
    return member?.role || null
  }

  const value: CommunityContextType = {
    communities,
    currentCommunity,
    communityMembers,
    communityMessages,
    joinedCommunities,
    isLoading,
    setCurrentCommunity,
    joinCommunity,
    leaveCommunity,
    createCommunity,
    updateCommunity,
    sendMessage,
    getChannelMessages,
    getUserRole,
  }

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}
