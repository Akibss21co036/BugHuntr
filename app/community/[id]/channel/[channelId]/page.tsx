"use client"

import type React from "react"

import { useParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { useCommunity } from "@/hooks/use-community"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Hash, Users, Settings, Pin, Search, Paperclip } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function ChannelPage() {
  const params = useParams()
  const communityId = params.id as string
  const channelId = params.channelId as string
  const { communities, getChannelMessages, sendMessage } = useCommunity()
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const community = communities.find((c) => c.id === communityId)
  const channel = community?.channels.find((c) => c.id === channelId)
  const messages = getChannelMessages(channelId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    await sendMessage(channelId, newMessage)
    setNewMessage("")
    setIsTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!community || !channel) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Channel not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Channel Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-xl font-semibold">{channel.name}</h1>
              <p className="text-sm text-muted-foreground">{channel.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Pin className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6">
        <div className="py-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 group hover:bg-muted/50 p-2 rounded-lg transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={message.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-cyber-blue to-neon-green text-white font-bold">
                    {message.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{message.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.edited && (
                      <Badge variant="outline" className="text-xs">
                        edited
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
                  {message.replies && message.replies.length > 0 && (
                    <div className="mt-2 ml-4 border-l-2 border-muted pl-4 space-y-2">
                      {message.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{reply.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{reply.username}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                setIsTyping(e.target.value.length > 0)
              }}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${channel.name}`}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {isTyping && (
          <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift+Enter for new line</p>
        )}
      </div>
    </div>
  )
}
