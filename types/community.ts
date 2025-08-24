export interface Community {
  id: string
  name: string
  description: string
  avatar?: string
  banner?: string
  isPrivate: boolean
  memberCount: number
  createdAt: string
  ownerId: string
  tags: string[]
  projects: CommunityProject[]
  channels: CommunityChannel[]
}

export interface CommunityProject {
  id: string
  name: string
  description: string
  status: "active" | "completed" | "paused"
  priority: "low" | "medium" | "high" | "critical"
  assignedMembers: string[]
  createdAt: string
  dueDate?: string
  progress: number
  tags: string[]
}

export interface CommunityChannel {
  id: string
  name: string
  type: "text" | "voice" | "announcement"
  description?: string
  isPrivate: boolean
  memberIds: string[]
  createdAt: string
}

export interface CommunityMember {
  id: string
  userId: string
  username: string
  avatar?: string
  role: "owner" | "admin" | "moderator" | "member"
  joinedAt: string
  isOnline: boolean
  permissions: string[]
}

export interface CommunityMessage {
  id: string
  channelId: string
  userId: string
  username: string
  avatar?: string
  content: string
  timestamp: string
  edited?: boolean
  replies?: CommunityMessage[]
}

export type CommunityRole = "owner" | "admin" | "moderator" | "member"
