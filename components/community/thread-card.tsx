"use client"

import type { BugThread } from "@/types/community"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Paperclip } from "lucide-react"

interface ThreadCardProps {
  thread: BugThread
  isActive: boolean
  onSelect: (threadId: string) => void
  currentUserId?: string
  onDeleteThread?: (threadId: string) => Promise<void>
}

const statusClass: Record<BugThread["status"], string> = {
  open: "border-[#2A3645] text-slate-300",
  in_progress: "border-blue-500/50 text-blue-300",
  solved: "border-[#2A3645] text-slate-300",
  closed: "border-[#2A3645] text-slate-500",
}

const statusLabel: Record<BugThread["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  solved: "Solved",
  closed: "Closed",
}

const formatTime = (value: string) => {
  const date = new Date(value)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ThreadCard({
  thread,
  isActive,
  onSelect,
  currentUserId,
  onDeleteThread,
}: ThreadCardProps) {
  const severityLine =
    thread.severity === "critical"
      ? "bg-red-500"
      : thread.severity === "medium"
        ? "bg-amber-400"
        : "bg-slate-500"

  const issueKey = `BUG-${thread.id.slice(0, 5).toUpperCase()}`
  const canDeleteThread = Boolean(currentUserId && currentUserId === thread.authorId && onDeleteThread)
  const handleSelect = () => onSelect(thread.id)

  return (
    <div
      className={[
        "w-full text-left border-t border-[#141925] px-4 py-3 transition-all",
        isActive
          ? "bg-[#10203B] border-l-2 border-l-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.28),0_0_24px_rgba(37,99,235,0.16)]"
          : "hover:bg-[#0D121B] border-l-2 border-l-transparent",
      ].join(" ")}
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          handleSelect()
        }
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 h-5 w-0.5 rounded-full ${severityLine}`} />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-2.5">
              <span className="text-[11px] text-slate-500">{issueKey}</span>
              <h3 className="text-sm font-medium text-slate-100 truncate">{thread.title}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-500">{formatTime(thread.updatedAt)}</span>
              {canDeleteThread && (
                <button
                  type="button"
                  className="rounded border border-red-500/40 px-1.5 py-0.5 text-[9px] font-medium text-red-300 hover:bg-red-500/10"
                  onClick={(event) => {
                    event.stopPropagation()
                    void onDeleteThread?.(thread.id)
                  }}
                >
                  Delete thread
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 line-clamp-1">{thread.description}</p>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${statusClass[thread.status]}`}>
              {statusLabel[thread.status]}
            </Badge>

            {thread.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="h-5 px-1.5 text-[10px] border-[#252B38] text-slate-400">
                {tag}
              </Badge>
            ))}

            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {thread.commentCount}
            </span>

            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {thread.attachmentUrls.length}
            </span>

            <span>{thread.authorUsername}</span>
          </div>

          {thread.attachmentUrls.length > 0 && (
            <p className="text-[10px] text-slate-500">Attachment previews are shown on the right panel.</p>
          )}
        </div>
      </div>
    </div>
  )
}
