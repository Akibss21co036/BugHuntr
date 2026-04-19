"use client"

import { useEffect, useMemo, useState } from "react"
import { db } from "@/firebaseConfig"
import { useAuth } from "@/components/auth/auth-context"
import type {
  BugSeverity,
  BugThread,
  BugThreadStatus,
  CommunityNotification,
  LeaderboardEntry,
  ThreadAttachment,
  ThreadChatMessage,
  ThreadComment,
} from "@/types/community"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"

export interface ThreadFilters {
  search: string
  severity: "all" | BugSeverity
  status: "all" | BugThreadStatus
  tags: string[]
}

interface CreateThreadInput {
  title: string
  description: string
  severity: BugSeverity
  tags: string[]
}

interface CreateCommentInput {
  threadId: string
  content: string
  parentId?: string
}

const DEFAULT_FILTERS: ThreadFilters = {
  search: "",
  severity: "all",
  status: "all",
  tags: [],
}

const toIso = (value: any): string => {
  if (!value) return new Date().toISOString()
  if (typeof value === "string") return value
  if (typeof value?.toDate === "function") return value.toDate().toISOString()
  return new Date(value).toISOString()
}

const imageExtensionPattern = /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i

const inferAttachmentType = (url: string): string => {
  const match = url.match(imageExtensionPattern)
  if (!match) return "application/octet-stream"
  const ext = match[1].toLowerCase()
  if (ext === "jpg") return "image/jpeg"
  return `image/${ext}`
}

const getAttachmentNameFromUrl = (url: string, fallback: string): string => {
  try {
    const decodedUrl = decodeURIComponent(url.split("?")[0])
    const parts = decodedUrl.split("/")
    const name = parts[parts.length - 1]
    return name || fallback
  } catch {
    return fallback
  }
}

const normalizeAttachment = (value: any, index: number): ThreadAttachment | null => {
  if (typeof value === "string") {
    const fallbackName = `attachment-${index + 1}`
    return {
      name: getAttachmentNameFromUrl(value, fallbackName),
      url: value,
      type: inferAttachmentType(value),
      size: 0,
    }
  }

  if (value && typeof value === "object" && typeof value.url === "string") {
    const fallbackName = `attachment-${index + 1}`
    return {
      name: typeof value.name === "string" && value.name.trim() ? value.name : getAttachmentNameFromUrl(value.url, fallbackName),
      url: value.url,
      type: typeof value.type === "string" && value.type.trim() ? value.type : inferAttachmentType(value.url),
      size: typeof value.size === "number" ? value.size : 0,
    }
  }

  return null
}

const normalizeAttachments = (value: any): ThreadAttachment[] => {
  if (!Array.isArray(value)) return []

  return value
    .map((entry, index) => normalizeAttachment(entry, index))
    .filter((entry): entry is ThreadAttachment => entry !== null)
}

export function useThreadCollaboration(communityId: string, channelId: string) {
  const { user } = useAuth()
  const [threads, setThreads] = useState<BugThread[]>([])
  const [comments, setComments] = useState<ThreadComment[]>([])
  const [chatMessages, setChatMessages] = useState<ThreadChatMessage[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [notifications, setNotifications] = useState<CommunityNotification[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [filters, setFilters] = useState<ThreadFilters>(DEFAULT_FILTERS)
  const [isLoadingThreads, setIsLoadingThreads] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!communityId || !channelId) {
      setThreads([])
      setIsLoadingThreads(false)
      return
    }

    const threadsRef = collection(db, "communities", communityId, "threads")
    const unsubscribe = onSnapshot(threadsRef, (snapshot) => {
      const items = snapshot.docs
        .map((threadDoc) => {
          const data = threadDoc.data()
          return {
            id: threadDoc.id,
            communityId,
            channelId: data.channelId ?? "general",
            title: data.title ?? "Untitled thread",
            description: data.description ?? "",
            severity: data.severity ?? "low",
            status: data.status ?? "open",
            tags: Array.isArray(data.tags) ? data.tags : [],
            authorId: data.authorId ?? "",
            authorUsername: data.authorUsername ?? "Anonymous",
            createdAt: toIso(data.createdAt),
            updatedAt: toIso(data.updatedAt),
            solutionCommentId: data.solutionCommentId,
            solutionByUserId: data.solutionByUserId,
            commentCount: Number(data.commentCount ?? 0),
            attachmentUrls: normalizeAttachments(data.attachmentUrls),
          } as BugThread
        })
        .filter((thread) => thread.channelId === channelId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

      setThreads(items)
      setIsLoadingThreads(false)
    })

    return () => unsubscribe()
  }, [communityId, channelId])

  useEffect(() => {
    if (!selectedThreadId) {
      setComments([])
      setChatMessages([])
      return
    }

    const commentsRef = query(
      collection(db, "communities", communityId, "threads", selectedThreadId, "comments"),
      orderBy("createdAt", "asc"),
    )
    const unsubComments = onSnapshot(commentsRef, (snapshot) => {
      const items: ThreadComment[] = snapshot.docs.map((commentDoc) => {
        const data = commentDoc.data()
        return {
          id: commentDoc.id,
          threadId: selectedThreadId,
          communityId,
          content: data.content ?? "",
          authorId: data.authorId ?? "",
          authorUsername: data.authorUsername ?? "Anonymous",
          parentId: data.parentId,
          mentions: Array.isArray(data.mentions) ? data.mentions : [],
          createdAt: toIso(data.createdAt),
          updatedAt: toIso(data.updatedAt),
          isSolution: Boolean(data.isSolution),
          attachmentUrls: normalizeAttachments(data.attachmentUrls),
        }
      })
      setComments(items)
    })

    const chatRef = query(
      collection(db, "communities", communityId, "threads", selectedThreadId, "chat"),
      orderBy("createdAt", "asc"),
      limit(250),
    )
    const unsubChat = onSnapshot(chatRef, (snapshot) => {
      const items: ThreadChatMessage[] = snapshot.docs.map((chatDoc) => {
        const data = chatDoc.data()
        return {
          id: chatDoc.id,
          threadId: selectedThreadId,
          communityId,
          content: data.content ?? "",
          authorId: data.authorId ?? "",
          authorUsername: data.authorUsername ?? "Anonymous",
          createdAt: toIso(data.createdAt),
        }
      })
      setChatMessages(items)
    })

    return () => {
      unsubComments()
      unsubChat()
    }
  }, [communityId, selectedThreadId])

  useEffect(() => {
    if (!communityId) {
      setLeaderboard([])
      return
    }

    const leaderboardRef = query(
      collection(db, "communities", communityId, "members"),
      orderBy("reputation", "desc"),
      limit(50),
    )

    const unsubscribe = onSnapshot(leaderboardRef, (snapshot) => {
      const entries: LeaderboardEntry[] = snapshot.docs.map((memberDoc) => {
        const data = memberDoc.data()
        return {
          userId: data.userId ?? memberDoc.id,
          username: data.username ?? "Anonymous",
          role: data.role ?? "member",
          reputation: Number(data.reputation ?? 0),
          solvedCount: Number(data.solvedCount ?? 0),
          helpfulCount: Number(data.helpfulCount ?? 0),
          bugsPosted: Number(data.bugsPosted ?? 0),
          skills: Array.isArray(data.skills) ? data.skills : [],
        }
      })
      setLeaderboard(entries)
    })

    return () => unsubscribe()
  }, [communityId])

  useEffect(() => {
    if (!user?.id || !communityId) {
      setNotifications([])
      return
    }

    const notificationsRef = query(
      collection(db, "users", user.id, "notifications"),
      orderBy("createdAt", "desc"),
      limit(30),
    )

    const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
      const list = snapshot.docs
        .map((notificationDoc) => {
          const data = notificationDoc.data()
          return {
            id: notificationDoc.id,
            communityId: data.communityId ?? "",
            type: data.type ?? "reply",
            title: data.title ?? "Notification",
            message: data.message ?? "",
            threadId: data.threadId ?? "",
            commentId: data.commentId,
            createdAt: toIso(data.createdAt),
            read: Boolean(data.read),
          } as CommunityNotification
        })
        .filter((notification) => notification.communityId === communityId)

      setNotifications(list)
    })

    return () => unsubscribe()
  }, [communityId, user?.id])

  useEffect(() => {
    if (selectedThreadId && threads.some((thread) => thread.id === selectedThreadId)) return
    if (threads.length > 0) {
      setSelectedThreadId(threads[0].id)
      return
    }
    setSelectedThreadId(null)
  }, [threads, selectedThreadId])

  const filteredThreads = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase()

    return threads.filter((thread) => {
      const matchSearch =
        normalizedSearch.length === 0 ||
        thread.title.toLowerCase().includes(normalizedSearch) ||
        thread.description.toLowerCase().includes(normalizedSearch) ||
        thread.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))

      const matchSeverity = filters.severity === "all" || thread.severity === filters.severity
      const matchStatus = filters.status === "all" || thread.status === filters.status
      const matchTags =
        filters.tags.length === 0 || filters.tags.every((activeTag) => thread.tags.includes(activeTag))

      return matchSearch && matchSeverity && matchStatus && matchTags
    })
  }, [filters, threads])

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId, threads],
  )

  const uploadAttachments = async (files: File[], pathPrefix: string): Promise<ThreadAttachment[]> => {
    const settledUploads = await Promise.allSettled(
      files.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", pathPrefix)

        const response = await fetch("/api/cloudinary/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({ error: "Cloudinary upload failed" }))
          throw new Error(errorPayload?.error ?? "Cloudinary upload failed")
        }

        const payload = (await response.json()) as { url?: string }
        if (!payload.url) {
          throw new Error("Cloudinary upload did not return a URL")
        }

        return {
          name: file.name,
          url: payload.url,
          type: file.type || "application/octet-stream",
          size: file.size,
        } as ThreadAttachment
      }),
    )

    const uploads: ThreadAttachment[] = []
    settledUploads.forEach((result, index) => {
      if (result.status === "fulfilled") {
        uploads.push(result.value)
        return
      }

      console.error(`Attachment upload failed for ${files[index]?.name ?? "unknown-file"}`, result.reason)
    })

    return uploads
  }

  const ensureCommunityMember = async (
    userId: string,
    username: string,
    role: LeaderboardEntry["role"] = "member",
  ) => {
    await setDoc(
      doc(db, "communities", communityId, "members", userId),
      {
        userId,
        username,
        role,
        reputation: 0,
        solvedCount: 0,
        helpfulCount: 0,
        bugsPosted: 0,
        skills: [],
        joinedAt: serverTimestamp(),
        isOnline: true,
        permissions: ["comment", "create_thread"],
      },
      { merge: true },
    )
  }

  const awardReputation = async (
    userId: string,
    username: string,
    points: number,
    reason: string,
    threadId: string,
    statsUpdate?: { helpfulCount?: number; solvedCount?: number; bugsPosted?: number },
  ) => {
    await ensureCommunityMember(userId, username)

    await updateDoc(doc(db, "communities", communityId, "members", userId), {
      reputation: increment(points),
      helpfulCount: increment(statsUpdate?.helpfulCount ?? 0),
      solvedCount: increment(statsUpdate?.solvedCount ?? 0),
      bugsPosted: increment(statsUpdate?.bugsPosted ?? 0),
      updatedAt: serverTimestamp(),
    })

    await addDoc(collection(db, "communities", communityId, "reputation_events"), {
      userId,
      username,
      points,
      reason,
      threadId,
      createdAt: serverTimestamp(),
    })
  }

  const createNotification = async (
    targetUserId: string,
    type: CommunityNotification["type"],
    title: string,
    message: string,
    threadId: string,
    commentId?: string,
  ) => {
    await addDoc(collection(db, "users", targetUserId, "notifications"), {
      communityId,
      type,
      title,
      message,
      threadId,
      commentId: commentId ?? null,
      createdAt: serverTimestamp(),
      read: false,
    })
  }

  const parseMentions = (content: string): string[] => {
    const matches = content.match(/@([a-zA-Z0-9_-]+)/g)
    if (!matches) return []
    return Array.from(new Set(matches.map((entry) => entry.slice(1).toLowerCase())))
  }

  const createThread = async (input: CreateThreadInput, files: File[] = []) => {
    if (!user?.id || !communityId || !channelId) return
    if (!input.title.trim() || !input.description.trim()) return

    setIsSaving(true)
    try {
      await ensureCommunityMember(user.id, user.username)

      const threadRef = await addDoc(collection(db, "communities", communityId, "threads"), {
        channelId,
        title: input.title.trim(),
        description: input.description.trim(),
        severity: input.severity,
        status: "open",
        tags: input.tags,
        authorId: user.id,
        authorUsername: user.username,
        solutionCommentId: null,
        solutionByUserId: null,
        commentCount: 0,
        attachmentUrls: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setSelectedThreadId(threadRef.id)

      // Keep posting snappy: run attachment upload and side effects in background.
      void (async () => {
        try {
          if (files.length > 0) {
            const attachments = await uploadAttachments(files, `community-threads/${communityId}/${threadRef.id}`)
            if (attachments.length > 0) {
              await updateDoc(doc(db, "communities", communityId, "threads", threadRef.id), {
                attachmentUrls: attachments,
                updatedAt: serverTimestamp(),
              })
            }
          }
        } catch (error) {
          console.error("Thread attachment upload/update failed", error)
        }

        try {
          await awardReputation(user.id, user.username, 5, "Posted bug thread", threadRef.id, { bugsPosted: 1 })
        } catch (error) {
          console.error("Thread reputation award failed", error)
        }

        try {
          const expertMatches = suggestExperts(input.tags).slice(0, 3)
          for (const expert of expertMatches) {
            if (expert.userId === user.id) continue
            await createNotification(
              expert.userId,
              "mention",
              "Expert requested",
              `${user.username} opened a thread matching your skills: ${input.title}`,
              threadRef.id,
            )
          }
        } catch (error) {
          console.error("Thread expert notification failed", error)
        }
      })()
    } finally {
      setIsSaving(false)
    }
  }

  const addComment = async (input: CreateCommentInput, files: File[] = []) => {
    if (!user?.id || !communityId || !input.content.trim()) return

    setIsSaving(true)
    try {
      const thread = threads.find((item) => item.id === input.threadId)
      if (!thread) return

      await ensureCommunityMember(user.id, user.username)
      const mentions = parseMentions(input.content)

      const commentRef = await addDoc(
        collection(db, "communities", communityId, "threads", input.threadId, "comments"),
        {
          threadId: input.threadId,
          communityId,
          content: input.content.trim(),
          authorId: user.id,
          authorUsername: user.username,
          parentId: input.parentId ?? null,
          mentions,
          isSolution: false,
          attachmentUrls: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      )

      if (files.length > 0) {
        const attachments = await uploadAttachments(files, `community-comments/${communityId}/${input.threadId}/${commentRef.id}`)
        if (attachments.length > 0) {
          await updateDoc(doc(db, "communities", communityId, "threads", input.threadId, "comments", commentRef.id), {
            attachmentUrls: attachments,
            updatedAt: serverTimestamp(),
          })
        }
      }

      await updateDoc(doc(db, "communities", communityId, "threads", input.threadId), {
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      })

      await awardReputation(user.id, user.username, 2, "Helpful thread reply", input.threadId, { helpfulCount: 1 })

      if (thread.authorId !== user.id) {
        await createNotification(
          thread.authorId,
          "reply",
          "New reply on your thread",
          `${user.username} replied to ${thread.title}`,
          input.threadId,
          commentRef.id,
        )
      }

      if (mentions.length > 0) {
        const mentionedUsers = leaderboard.filter((entry) => mentions.includes(entry.username.toLowerCase()))
        for (const mentioned of mentionedUsers) {
          if (mentioned.userId === user.id) continue
          await createNotification(
            mentioned.userId,
            "mention",
            "You were tagged",
            `${user.username} mentioned you in ${thread.title}`,
            input.threadId,
            commentRef.id,
          )
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  const markCommentAsSolution = async (threadId: string, commentId: string) => {
    if (!user?.id || !communityId) return

    const thread = threads.find((item) => item.id === threadId)
    const comment = comments.find((item) => item.id === commentId)
    if (!thread || !comment) return
    if (thread.authorId !== user.id) return

    setIsSaving(true)
    try {
      await updateDoc(doc(db, "communities", communityId, "threads", threadId), {
        solutionCommentId: commentId,
        solutionByUserId: comment.authorId,
        status: "solved",
        updatedAt: serverTimestamp(),
      })

      await updateDoc(doc(db, "communities", communityId, "threads", threadId, "comments", commentId), {
        isSolution: true,
        updatedAt: serverTimestamp(),
      })

      await awardReputation(comment.authorId, comment.authorUsername, 25, "Solution accepted", threadId, {
        solvedCount: 1,
      })

      if (thread.authorId !== comment.authorId) {
        await awardReputation(thread.authorId, thread.authorUsername, 10, "Thread resolved", threadId)
      }

      await createNotification(
        comment.authorId,
        "solution_accepted",
        "Solution accepted",
        `${thread.authorUsername} marked your reply as the solution in ${thread.title}`,
        threadId,
        commentId,
      )
    } finally {
      setIsSaving(false)
    }
  }

  const updateThreadStatus = async (threadId: string, status: BugThreadStatus) => {
    await updateDoc(doc(db, "communities", communityId, "threads", threadId), {
      status,
      updatedAt: serverTimestamp(),
    })
  }

  const sendThreadChatMessage = async (threadId: string, content: string) => {
    if (!user?.id || !content.trim()) return

    await addDoc(collection(db, "communities", communityId, "threads", threadId, "chat"), {
      threadId,
      communityId,
      content: content.trim(),
      authorId: user.id,
      authorUsername: user.username,
      createdAt: serverTimestamp(),
    })
  }

  const deleteThread = async (threadId: string) => {
    if (!user?.id) return

    const thread = threads.find((item) => item.id === threadId)
    if (!thread) return
    if (thread.authorId !== user.id) return

    const commentsSnapshot = await getDocs(collection(db, "communities", communityId, "threads", threadId, "comments"))
    for (const commentDoc of commentsSnapshot.docs) {
      await deleteDoc(commentDoc.ref)
    }

    const chatSnapshot = await getDocs(collection(db, "communities", communityId, "threads", threadId, "chat"))
    for (const chatDoc of chatSnapshot.docs) {
      await deleteDoc(chatDoc.ref)
    }

    await deleteDoc(doc(db, "communities", communityId, "threads", threadId))
  }

  const deleteThreadAttachment = async (threadId: string, attachmentUrl: string) => {
    if (!user?.id) return

    const thread = threads.find((item) => item.id === threadId)
    if (!thread) return
    if (thread.authorId !== user.id) return

    const nextAttachments = thread.attachmentUrls.filter((file) => file.url !== attachmentUrl)
    await updateDoc(doc(db, "communities", communityId, "threads", threadId), {
      attachmentUrls: nextAttachments,
      updatedAt: serverTimestamp(),
    })
  }

  const deleteCommentAttachment = async (threadId: string, commentId: string, attachmentUrl: string) => {
    if (!user?.id) return

    const comment = comments.find((item) => item.id === commentId)
    if (!comment) return
    if (comment.authorId !== user.id) return

    const nextAttachments = comment.attachmentUrls.filter((file) => file.url !== attachmentUrl)
    await updateDoc(doc(db, "communities", communityId, "threads", threadId, "comments", commentId), {
      attachmentUrls: nextAttachments,
      updatedAt: serverTimestamp(),
    })
  }

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user?.id) return
    await updateDoc(doc(db, "users", user.id, "notifications", notificationId), {
      read: true,
      updatedAt: serverTimestamp(),
    })
  }

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    threads.forEach((thread) => {
      thread.tags.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  }, [threads])

  const suggestExperts = (tags: string[]): LeaderboardEntry[] => {
    if (tags.length === 0) return leaderboard.slice(0, 5)

    const normalizedTags = tags.map((tag) => tag.toLowerCase())
    return [...leaderboard]
      .map((entry) => {
        const overlap = entry.skills.filter((skill) => normalizedTags.includes(skill.toLowerCase())).length
        return { entry, overlap }
      })
      .filter((result) => result.overlap > 0)
      .sort((a, b) => {
        if (b.overlap !== a.overlap) return b.overlap - a.overlap
        return b.entry.reputation - a.entry.reputation
      })
      .map((result) => result.entry)
  }

  return {
    filters,
    setFilters,
    filteredThreads,
    threads,
    selectedThread,
    selectedThreadId,
    setSelectedThreadId,
    comments,
    chatMessages,
    leaderboard,
    notifications,
    availableTags,
    isLoadingThreads,
    isSaving,
    createThread,
    deleteThread,
    addComment,
    markCommentAsSolution,
    updateThreadStatus,
    sendThreadChatMessage,
    deleteThreadAttachment,
    deleteCommentAttachment,
    markNotificationAsRead,
    suggestExperts,
  }
}
