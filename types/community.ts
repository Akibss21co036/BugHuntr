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
  reputation?: number
  skills?: string[]
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

export type BugSeverity = "low" | "medium" | "critical"
export type BugThreadStatus = "open" | "in_progress" | "solved" | "closed"

export interface ThreadAttachment {
  name: string
  url: string
  type: string
  size: number
}

export interface BugThread {
  id: string
  communityId: string
  channelId: string
  title: string
  description: string
  severity: BugSeverity
  status: BugThreadStatus
  tags: string[]
  authorId: string
  authorUsername: string
  createdAt: string
  updatedAt: string
  solutionCommentId?: string
  solutionByUserId?: string
  commentCount: number
  attachmentUrls: ThreadAttachment[]
}

export interface ThreadComment {
  id: string
  threadId: string
  communityId: string
  content: string
  authorId: string
  authorUsername: string
  parentId?: string
  mentions: string[]
  createdAt: string
  updatedAt: string
  isSolution?: boolean
  attachmentUrls: ThreadAttachment[]
}

export interface ThreadChatMessage {
  id: string
  threadId: string
  communityId: string
  content: string
  authorId: string
  authorUsername: string
  createdAt: string
}

export interface CommunityNotification {
  id: string
  communityId: string
  type: "reply" | "mention" | "solution_accepted"
  title: string
  message: string
  threadId: string
  commentId?: string
  createdAt: string
  read: boolean
}

export interface LeaderboardEntry {
  userId: string
  username: string
  role: CommunityRole
  reputation: number
  solvedCount: number
  helpfulCount: number
  bugsPosted: number
  skills: string[]
}
