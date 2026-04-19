"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-context"
import { useCommunity } from "@/hooks/use-community"
import { useThreadCollaboration } from "@/hooks/use-thread-collaboration"
import type { BugSeverity, BugThread, BugThreadStatus } from "@/types/community"
import { ThreadCard } from "@/components/community/thread-card"
import { CommentBox } from "@/components/community/comment-box"
import { ChatPanel } from "@/components/community/chat-panel"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  Filter,
  Search,
  Plus,
  X,
} from "lucide-react"

const shellClass = "rounded-2xl border border-[#181D27] bg-[#070A10]"
const panelClass = "rounded-xl border border-[#181D27] bg-[#0A0E15]"
const statusOptions: Array<{ value: "all" | BugThreadStatus; label: string }> = [
  { value: "all", label: "All status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "solved", label: "Solved" },
  { value: "closed", label: "Closed" },
]

const severityOptions: Array<{ value: "all" | BugSeverity; label: string }> = [
  { value: "all", label: "All severity" },
  { value: "critical", label: "Critical" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const createSeverityOptions: Array<{ value: BugSeverity; label: string }> = [
  { value: "critical", label: "Critical" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const threadStatusOptions: Array<{ value: BugThreadStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "solved", label: "Solved" },
  { value: "closed", label: "Closed" },
]

const isImageAttachment = (file: { url: string; type: string }) => {
  if (file.type?.startsWith("image/")) return true
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(file.url)
}

const isImageFile = (file: File) => file.type.startsWith("image/")

interface ThreadGroupProps {
  title: string
  count: number
  threads: BugThread[]
  selectedThreadId?: string
  onSelect: (threadId: string) => void
  currentUserId?: string
  onDeleteThread?: (threadId: string) => Promise<void>
  emptyMessage: string
}

function ThreadGroup({
  title,
  count,
  threads,
  selectedThreadId,
  onSelect,
  currentUserId,
  onDeleteThread,
  emptyMessage,
}: ThreadGroupProps) {
  return (
    <section className="border-b border-[#151A24] last:border-b-0">
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <span>{title}</span>
          <span className="text-xs text-slate-500">{count}</span>
        </div>
      </div>

      {threads.length > 0 ? (
        <div>
          {threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isActive={selectedThreadId === thread.id}
              onSelect={onSelect}
              currentUserId={currentUserId}
              onDeleteThread={onDeleteThread}
            />
          ))}
        </div>
      ) : (
        <p className="px-3 pb-3 text-xs text-slate-500">{emptyMessage}</p>
      )}
    </section>
  )
}

export default function CommunityChannelPage() {
  const params = useParams<{ communityId: string; channelId: string }>()
  const communityId = typeof params?.communityId === "string" ? params.communityId : ""
  const channelId = typeof params?.channelId === "string" ? params.channelId : ""

  const { user } = useAuth()
  const { communities, joinedCommunityIds, getCommunityChannels, joinCommunity } = useCommunity()

  const community = useMemo(
    () => communities.find((item) => item.id === communityId) ?? null,
    [communities, communityId],
  )

  const channels = getCommunityChannels(communityId)
  const activeChannel = channels.find((channel) => channel.id === channelId)
  const hasJoinedCommunity = joinedCommunityIds.includes(communityId)

  const {
    filters,
    setFilters,
    filteredThreads,
    selectedThread,
    selectedThreadId,
    setSelectedThreadId,
    comments,
    chatMessages,
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
  } = useThreadCollaboration(communityId, channelId)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [newThreadDescription, setNewThreadDescription] = useState("")
  const [newThreadSeverity, setNewThreadSeverity] = useState<BugSeverity>("medium")
  const [newThreadTags, setNewThreadTags] = useState("react,api")
  const [newThreadFiles, setNewThreadFiles] = useState<File[]>([])

  const newThreadFilePreviews = useMemo(
    () =>
      newThreadFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        isImage: isImageFile(file),
      })),
    [newThreadFiles],
  )

  useEffect(() => {
    return () => {
      newThreadFilePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [newThreadFilePreviews])

  const criticalThreads = useMemo(
    () => filteredThreads.filter((thread) => thread.severity === "critical"),
    [filteredThreads],
  )

  const activeThreads = useMemo(
    () =>
      filteredThreads
        .filter((thread) => thread.status === "open" || thread.status === "in_progress")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [filteredThreads],
  )

  const resolvedThreads = useMemo(
    () =>
      filteredThreads
        .filter((thread) => thread.status === "solved" || thread.status === "closed")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [filteredThreads],
  )

  const hasThreads = filteredThreads.length > 0
  const canDeleteThreadAttachment = Boolean(user?.id && selectedThread?.authorId === user.id)

  const handleCreateThread = async () => {
    const tags = newThreadTags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)

    try {
      await createThread(
        {
          title: newThreadTitle,
          description: newThreadDescription,
          severity: newThreadSeverity,
          tags,
        },
        newThreadFiles,
      )
    } catch (error) {
      console.error("Failed to create thread", error)
      alert("Could not post bug. Please try again.")
      return
    }

    setNewThreadTitle("")
    setNewThreadDescription("")
    setNewThreadSeverity("medium")
    setNewThreadTags("")
    setNewThreadFiles([])
    setIsCreateDialogOpen(false)
  }

  const removeNewThreadFile = (index: number) => {
    setNewThreadFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
  }

  const handleDeleteThread = async (threadId: string) => {
    const shouldDelete = window.confirm("Delete this thread permanently?")
    if (!shouldDelete) return

    try {
      await deleteThread(threadId)
    } catch (error) {
      console.error("Failed to delete thread", error)
      alert("Could not delete thread. Please try again.")
    }
  }

  if (!community) {
    return (
      <main className="min-h-screen bg-[#06090E] p-4 text-slate-200">
        <div className={`${panelClass} p-10 text-center text-slate-400`}>Community not found.</div>
      </main>
    )
  }

  if (!hasJoinedCommunity) {
    return (
      <main className="min-h-screen bg-[#06090E] p-4 text-slate-200">
        <div className={`${panelClass} mx-auto max-w-2xl p-8 space-y-4`}>
          <h1 className="text-2xl font-semibold text-slate-100">Join {community.name}</h1>
          <p className="text-sm text-slate-400">
            Join this community to access channel bugs, discussion, and live collaboration.
          </p>
          <Button onClick={() => joinCommunity(community.id)}>Join community</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#06090E] text-slate-200 p-3 md:p-4">
      <div className={shellClass}>
        <header className="border-b border-[#151A24] px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link href="/communities" className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Back to communities">
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <span className="text-sm text-slate-300 truncate">{community.name}</span>
              <span className="text-slate-600">/</span>
              <span className="text-sm text-slate-100 truncate">#{activeChannel?.name ?? "channel"}</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-md border border-[#252B38] bg-[#0A0E15] px-2 py-1 text-xs text-slate-300">
                <span className="text-slate-500">Views</span>
                <span className="text-slate-600">&gt;</span>
                <span>List</span>
              </div>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-8 bg-blue-600 hover:bg-blue-500 text-white gap-1.5 px-3">
                    <Plus className="h-3.5 w-3.5" />
                    Post bug
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0A0E15] border-[#1C2230] text-slate-100">
                  <DialogHeader>
                    <DialogTitle>Create bug thread</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Post a bug with context so contributors can help solve it quickly.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <Input
                      placeholder="Title"
                      value={newThreadTitle}
                      onChange={(event) => setNewThreadTitle(event.target.value)}
                      className="bg-[#0F141D] border-[#252B38] text-slate-100"
                    />
                    <Textarea
                      placeholder="Description"
                      className="min-h-[140px] bg-[#0F141D] border-[#252B38] text-slate-100"
                      value={newThreadDescription}
                      onChange={(event) => setNewThreadDescription(event.target.value)}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Select value={newThreadSeverity} onValueChange={(value) => setNewThreadSeverity(value as BugSeverity)}>
                        <SelectTrigger className="bg-[#0F141D] border-[#252B38] text-slate-100">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0F141D] border-[#252B38] text-slate-100">
                          {createSeverityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Tags (comma separated)"
                        value={newThreadTags}
                        onChange={(event) => setNewThreadTags(event.target.value)}
                        className="bg-[#0F141D] border-[#252B38] text-slate-100"
                      />
                    </div>

                    <label className="text-xs text-slate-400 block">
                      Attach logs, screenshots, or code
                      <Input
                        type="file"
                        multiple
                        className="mt-1 bg-[#0F141D] border-[#252B38] text-slate-100"
                        onChange={(event) => setNewThreadFiles(Array.from(event.target.files ?? []))}
                      />
                    </label>

                    {newThreadFilePreviews.length === 0 && (
                      <p className="text-[11px] text-slate-500">No files selected yet. Preview and delete actions appear here.</p>
                    )}

                    {newThreadFilePreviews.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400">Preview</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {newThreadFilePreviews.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="rounded-md border border-[#252B38] bg-[#0F141D] overflow-hidden">
                              {file.isImage ? (
                                <img src={file.url} alt={file.name} className="h-28 w-full object-cover" />
                              ) : (
                                <div className="h-28 flex items-center justify-center text-xs text-slate-500 px-3 text-center">
                                  {file.name}
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-t border-[#252B38]">
                                <span className="text-[11px] text-slate-400 truncate">{file.name}</span>
                                <div className="flex items-center gap-1">
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-6 items-center rounded px-2 text-[11px] text-blue-300 hover:bg-blue-500/10"
                                  >
                                    Preview
                                  </a>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-400 hover:text-red-300"
                                    onClick={() => removeNewThreadFile(index)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                      onClick={handleCreateThread}
                      disabled={isSaving || !newThreadTitle.trim() || !newThreadDescription.trim()}
                    >
                      {isSaving ? "Posting..." : "Post bug"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <section className="border-b border-[#151A24] px-3 py-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <Input
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Search title, description, tags"
                className="h-8 pl-8 bg-[#0A0E15] border-[#252B38] text-slate-100 placeholder:text-slate-600"
              />
            </div>

            <div className="hidden lg:inline-flex items-center gap-1 rounded-md border border-[#252B38] bg-[#0A0E15] px-2 py-1 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </div>

            <Select
              value={filters.severity}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, severity: value as typeof prev.severity }))}
            >
              <SelectTrigger className="h-8 w-[145px] bg-[#0A0E15] border-[#252B38] text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F141D] border-[#252B38] text-slate-100">
                {severityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as typeof prev.status }))}
            >
              <SelectTrigger className="h-8 w-[145px] bg-[#0A0E15] border-[#252B38] text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F141D] border-[#252B38] text-slate-100">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {channels.map((channel) => (
              <Link key={channel.id} href={`/communities/${communityId}/channels/${channel.id}`}>
                <Badge
                  variant="outline"
                  className={
                    channel.id === channelId
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                      : "border-[#252B38] text-slate-400 hover:text-slate-200"
                  }
                >
                  #{channel.name}
                </Badge>
              </Link>
            ))}

            {availableTags.slice(0, 6).map((tag) => {
              const selected = filters.tags.includes(tag)
              return (
                <button
                  key={tag}
                  className={[
                    "text-xs px-2 py-1 rounded-md border transition-colors",
                    selected
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                      : "border-[#252B38] text-slate-500 hover:text-slate-300",
                  ].join(" ")}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      tags: selected ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag],
                    }))
                  }}
                >
                  #{tag}
                </button>
              )
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] min-h-[72vh]">
          <section className="border-b xl:border-b-0 xl:border-r border-[#151A24] flex min-h-[420px] flex-col bg-[#080B12]">
            <div className="px-4 py-3 border-b border-[#151A24] text-xs text-slate-500">
              {filteredThreads.length} threads in this channel
            </div>

            <div className="flex-1 overflow-y-auto">
              {!isLoadingThreads && !hasThreads && (
                <div className="py-16 px-6 text-center">
                  <p className="text-lg text-slate-100">No bugs yet. Be the first to post.</p>
                  <p className="mt-2 text-sm text-slate-500">Start a thread with repro steps to get fast help from the community.</p>
                  <Button className="mt-5 bg-blue-600 hover:bg-blue-500 text-white" onClick={() => setIsCreateDialogOpen(true)}>
                    Post bug
                  </Button>
                </div>
              )}

              {(isLoadingThreads || hasThreads) && (
                <div>
                  <ThreadGroup
                    title="Critical"
                    count={criticalThreads.length}
                    threads={criticalThreads.slice(0, 10)}
                    selectedThreadId={selectedThreadId ?? undefined}
                    onSelect={setSelectedThreadId}
                    currentUserId={user?.id}
                    onDeleteThread={handleDeleteThread}
                    emptyMessage="No critical bugs right now."
                  />
                  <ThreadGroup
                    title="Active"
                    count={activeThreads.length}
                    threads={activeThreads.slice(0, 20)}
                    selectedThreadId={selectedThreadId ?? undefined}
                    onSelect={setSelectedThreadId}
                    currentUserId={user?.id}
                    onDeleteThread={handleDeleteThread}
                    emptyMessage="No active bugs match these filters."
                  />
                  <ThreadGroup
                    title="Resolved"
                    count={resolvedThreads.length}
                    threads={resolvedThreads.slice(0, 20)}
                    selectedThreadId={selectedThreadId ?? undefined}
                    onSelect={setSelectedThreadId}
                    currentUserId={user?.id}
                    onDeleteThread={handleDeleteThread}
                    emptyMessage="No solved or closed bugs yet."
                  />
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-[520px] flex-col">
            {selectedThread ? (
              <>
                <div className="border-b border-[#151A24] px-5 py-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-slate-100">{selectedThread.title}</h3>
                      <p className="text-xs text-slate-500">Opened by {selectedThread.authorUsername}</p>
                    </div>
                    <Select
                      value={selectedThread.status}
                      onValueChange={(value) => updateThreadStatus(selectedThread.id, value as BugThreadStatus)}
                    >
                      <SelectTrigger className="w-[160px] bg-[#0F141D] border-[#252B38] text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F141D] border-[#252B38] text-slate-100">
                        {threadStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {user?.id === selectedThread.authorId && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-500/40 text-red-300 bg-transparent hover:bg-red-500/10"
                        onClick={() => handleDeleteThread(selectedThread.id)}
                      >
                        Delete thread
                      </Button>
                    )}
                  </div>

                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedThread.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedThread.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-[#252B38] text-slate-300">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  {selectedThread.attachmentUrls.length > 0 && (
                    <div className="space-y-2">
                      {selectedThread.attachmentUrls.some((file) => isImageAttachment(file)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedThread.attachmentUrls
                            .filter((file) => isImageAttachment(file))
                            .map((file) => (
                              <div key={file.url} className="relative">
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block overflow-hidden rounded-md border border-[#252B38] bg-[#0E141D]"
                                >
                                  <img src={file.url} alt={file.name} className="h-36 w-full object-cover" loading="lazy" />
                                </a>
                                {canDeleteThreadAttachment && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-6 w-6 bg-black/60 text-slate-200 hover:text-red-300"
                                    onClick={() => deleteThreadAttachment(selectedThread.id, file.url)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {selectedThread.attachmentUrls.map((file) => (
                          <div key={`${file.url}-${file.name}`} className="inline-flex items-center gap-1 rounded-md border border-[#252B38] px-1 py-0.5">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs px-1 py-0.5 text-slate-300 hover:text-slate-100"
                            >
                              {file.name}
                            </a>
                            {canDeleteThreadAttachment && (
                              <button
                                type="button"
                                className="p-0.5 text-slate-400 hover:text-red-300"
                                onClick={() => deleteThreadAttachment(selectedThread.id, file.url)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid flex-1 min-h-0 grid-cols-1 2xl:grid-cols-2 gap-4 p-4">
                  <CommentBox
                    comments={comments}
                    currentUserId={user?.id}
                    threadAuthorId={selectedThread.authorId}
                    solutionCommentId={selectedThread.solutionCommentId}
                    isSaving={isSaving}
                    onSubmit={(payload, files) => addComment({ threadId: selectedThread.id, ...payload }, files)}
                    onMarkSolution={(commentId) => markCommentAsSolution(selectedThread.id, commentId)}
                    onDeleteAttachment={(commentId, attachmentUrl) =>
                      deleteCommentAttachment(selectedThread.id, commentId, attachmentUrl)
                    }
                  />

                  <ChatPanel
                    messages={chatMessages}
                    currentUserId={user?.id}
                    isSaving={isSaving}
                    onSend={(content) => sendThreadChatMessage(selectedThread.id, content)}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-500">
                Select a bug thread from the left panel to start collaborating.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
