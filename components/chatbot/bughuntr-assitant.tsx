"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Shield,
  Minimize2,
  Maximize2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface BugHuntrAssistantProps {
  className?: string
}

export function BugHuntrAssistant({ className }: BugHuntrAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: "Hi! I'm your BugHuntr Assistant. I can help you navigate the app, understand features, and provide Firebase code snippets. Ask me anything!",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: "user-session",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I apologize, but I couldn't process your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please check your connection and try again.",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessageContent = (content: string) => {
    // Simple markdown-like formatting for code blocks
    const parts = content.split(/```(\w+)?\n([\s\S]*?)```/g)
    
    return parts.map((part, index) => {
      if (index % 3 === 2) {
        // This is code content
        return (
          <pre key={index} className="bg-muted p-3 rounded-lg mt-2 mb-2 overflow-x-auto text-sm">
            <code>{part}</code>
          </pre>
        )
      } else if (index % 3 === 0) {
        // This is regular text
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part}
          </span>
        )
      } else {
        // This is language identifier, skip
        return null
      }
    })
  }

  if (!isOpen) {
    return (
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-cyber-blue hover:bg-cyber-blue/90 shadow-lg hover:shadow-xl transition-all"
          data-testid="bughuntr-assistant-open-btn"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card className={`w-96 shadow-xl border-2 ${isMinimized ? 'h-16' : 'h-[500px]'}`}>
          <CardHeader className="pb-3 bg-gradient-to-r from-cyber-blue to-cyber-cyan text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-white/20 rounded-full">
                  <Shield className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-semibold">BugHuntr Assistant</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                  data-testid="bughuntr-assistant-minimize-btn"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                  data-testid="bughuntr-assistant-close-btn"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-[420px]">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!message.isUser && (
                        <Avatar className="h-8 w-8 bg-cyber-blue text-white">
                          <AvatarFallback className="bg-cyber-blue text-white text-xs">
                            <Shield className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[280px] rounded-lg p-3 ${
                          message.isUser
                            ? "bg-cyber-blue text-white ml-auto"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <div className="text-sm">{formatMessageContent(message.content)}</div>
                        <div className={`text-xs mt-2 opacity-70 ${message.isUser ? "text-blue-100" : "text-muted-foreground"}`}>
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      {message.isUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-cyber-blue to-neon-green text-white text-xs">
                            U
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8 bg-cyber-blue text-white">
                        <AvatarFallback className="bg-cyber-blue text-white text-xs">
                          <Shield className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about BugHuntr..."
                    disabled={isLoading}
                    className="flex-1"
                    data-testid="bughuntr-assistant-input"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    size="icon"
                    data-testid="bughuntr-assistant-send-btn"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ask about navigation, Firebase code, or BugHuntr features
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}