"use client"

import { useEffect, useMemo, useState } from "react"
import type { ThreadComment } from "@/types/community"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Reply, Paperclip, X } from "lucide-react"

interface CommentBoxProps {
  comments: ThreadComment[]
  currentUserId?: string
  threadAuthorId?: string
  solutionCommentId?: string
  isSaving: boolean
  onSubmit: (payload: { content: string; parentId?: string }, files: File[]) => Promise<void>
  onMarkSolution: (commentId: string) => Promise<void>
  onDeleteAttachment?: (commentId: string, attachmentUrl: string) => Promise<void>
}

const isImageAttachment = (file: { url: string; type: string }) => {
  if (file.type?.startsWith("image/")) return true
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(file.url)
}

const isImageFile = (file: File) => file.type.startsWith("image/")

const formatTime = (value: string) => {
  const date = new Date(value)
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CommentBox({
  comments,
  currentUserId,
  threadAuthorId,
  solutionCommentId,
  isSaving,
  onSubmit,
  onMarkSolution,
  onDeleteAttachment,
}: CommentBoxProps) {
  const [content, setContent] = useState("")
  const [replyTo, setReplyTo] = useState<ThreadComment | null>(null)
  const [files, setFiles] = useState<File[]>([])

  const filePreviews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        isImage: isImageFile(file),
      })),
    [files],
  )

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [filePreviews])

  const commentMap = useMemo(() => new Map(comments.map((comment) => [comment.id, comment])), [comments])

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [comments])

  const handleSubmit = async () => {
    if (!content.trim()) return
    await onSubmit({ content, parentId: replyTo?.id }, files)
    setContent("")
    setReplyTo(null)
    setFiles([])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
  }

  return (
    <Card className="rounded-xl border border-[#1B2430] bg-[#0F141B] shadow-sm h-full flex flex-col min-h-0">
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="text-lg text-slate-100">Thread Discussion</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col gap-4 px-4 pb-4">
        {sortedComments.length === 0 && (
          <p className="text-sm text-slate-400">No comments yet. Start the debugging discussion.</p>
        )}

        <div className="space-y-3 flex-1 min-h-[260px] overflow-y-auto pr-1">
          {sortedComments.map((comment) => {
            const isSolution = solutionCommentId === comment.id || comment.isSolution
            const parent = comment.parentId ? commentMap.get(comment.parentId) : null
            const canMarkSolution = currentUserId === threadAuthorId && !solutionCommentId && currentUserId !== comment.authorId

            return (
              <div
                key={comment.id}
                className={[
                  "rounded-lg border p-3",
                  isSolution
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-[#1F2A38] bg-[#111823]",
                  comment.parentId ? "ml-8" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-100">{comment.authorUsername}</span>
                    {isSolution && (
                      <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/40">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Accepted Solution
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{formatTime(comment.createdAt)}</span>
                </div>

                {parent && (
                  <p className="text-xs text-blue-300 mt-1">Replying to @{parent.authorUsername}</p>
                )}

                <p className="text-sm text-slate-200 mt-2 whitespace-pre-wrap">{comment.content}</p>

                {comment.attachmentUrls.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {comment.attachmentUrls.some((file) => isImageAttachment(file)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {comment.attachmentUrls
                          .filter((file) => isImageAttachment(file))
                          .map((file) => (
                            <div key={file.url} className="relative">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block overflow-hidden rounded border border-blue-500/30"
                              >
                                <img src={file.url} alt={file.name} className="h-32 w-full object-cover" loading="lazy" />
                              </a>
                              {currentUserId === comment.authorId && onDeleteAttachment && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1 h-6 w-6 bg-black/60 text-slate-200 hover:text-red-300"
                                  onClick={() => onDeleteAttachment(comment.id, file.url)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {comment.attachmentUrls.map((file) => (
                        <div key={`${file.url}-${file.name}`} className="inline-flex items-center gap-1 rounded border border-blue-500/30 px-1 py-0.5">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs px-1 py-0.5 text-blue-300 hover:bg-blue-500/10 rounded"
                          >
                            {file.name}
                          </a>
                          {currentUserId === comment.authorId && onDeleteAttachment && (
                            <button
                              type="button"
                              className="p-0.5 text-slate-400 hover:text-red-300"
                              onClick={() => onDeleteAttachment(comment.id, file.url)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReplyTo(comment)}>
                    <Reply className="h-3.5 w-3.5 mr-1" />
                    Reply
                  </Button>
                  {canMarkSolution && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-blue-500/40 text-blue-300 bg-transparent"
                      onClick={() => onMarkSolution(comment.id)}
                    >
                      Mark as solution
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {replyTo && (
          <div className="rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs text-blue-200 flex items-center justify-between">
            <span>Replying to @{replyTo.authorUsername}</span>
            <button className="text-blue-300 hover:text-blue-200" onClick={() => setReplyTo(null)}>
              Cancel
            </button>
          </div>
        )}

        <div className="space-y-3 border-t border-[#1F2A38] pt-3">
          <Textarea
            placeholder="Share findings, test results, or a fix idea..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[110px] bg-[#111823] border-[#1F2A38] text-slate-100"
          />

          <label className="inline-flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <Paperclip className="h-3.5 w-3.5" />
            Attach logs/screenshots (preview appears below)
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </label>

          {filePreviews.length === 0 && (
            <p className="text-[11px] text-slate-500">No files selected yet.</p>
          )}

          {filePreviews.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Preview</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filePreviews.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="rounded-md border border-[#1F2A38] bg-[#111823] overflow-hidden">
                    {file.isImage ? (
                      <img src={file.url} alt={file.name} className="h-24 w-full object-cover" />
                    ) : (
                      <div className="h-24 flex items-center justify-center px-3 text-center text-xs text-slate-500">
                        {file.name}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-t border-[#1F2A38]">
                      <Badge variant="outline" className="text-[11px] truncate max-w-[180px]">
                        {file.name}
                      </Badge>
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
                          onClick={() => removeFile(index)}
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

          <Button onClick={handleSubmit} disabled={isSaving || !content.trim()}>
            {isSaving ? "Saving..." : "Post Comment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
