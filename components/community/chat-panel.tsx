"use client"

import { useState } from "react"
import type { ThreadChatMessage } from "@/types/community"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

interface ChatPanelProps {
  messages: ThreadChatMessage[]
  currentUserId?: string
  isSaving: boolean
  onSend: (content: string) => Promise<void>
}

const formatTime = (value: string) => {
  const date = new Date(value)
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

export function ChatPanel({ messages, currentUserId, isSaving, onSend }: ChatPanelProps) {
  const [message, setMessage] = useState("")

  const handleSend = async () => {
    if (!message.trim()) return
    await onSend(message)
    setMessage("")
  }

  return (
    <Card className="rounded-xl border border-[#1B2430] bg-[#0F141B] shadow-sm h-full flex flex-col min-h-0">
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="text-base flex items-center gap-2 text-slate-100">
          <Zap className="h-4 w-4 text-blue-400" />
          Live Debug Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col gap-3 px-4 pb-4">
        <div className="flex-1 min-h-[220px] overflow-y-auto rounded-lg border border-[#1F2A38] bg-[#111823] p-3 space-y-2.5">
          {messages.length === 0 && (
            <p className="text-xs text-slate-400">Thread chat is quiet. Start live debugging.</p>
          )}
          {messages.map((item) => {
            const isOwnMessage = Boolean(currentUserId) && item.authorId === currentUserId

            return (
              <div key={item.id} className={["flex", isOwnMessage ? "justify-end" : "justify-start"].join(" ")}>
                <div
                  className={[
                    "max-w-[86%] rounded-xl px-3 py-2",
                    isOwnMessage
                      ? "bg-blue-600 text-white border border-blue-400/40"
                      : "bg-[#182332] text-slate-100 border border-[#2A3C54]",
                  ].join(" ")}
                >
                  <div className={["mb-1 flex items-center gap-2 text-[10px]", isOwnMessage ? "justify-end text-blue-100" : "justify-between text-slate-400"].join(" ")}>
                    {!isOwnMessage && <span className="font-semibold text-blue-200">{item.authorUsername}</span>}
                    <span>{formatTime(item.createdAt)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Share quick live notes..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="bg-[#111823] border-[#1F2A38] text-slate-100"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleSend()
              }
            }}
          />
          <Button onClick={handleSend} disabled={isSaving || !message.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
