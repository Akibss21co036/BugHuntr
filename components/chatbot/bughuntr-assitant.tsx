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
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-context"

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
  const router = useRouter()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: "🛡️ Welcome to BugHuntr Assistant!\n\nI'm here to help you with:\n• **Navigate** - Go to Feed, Submissions, Profile, etc.\n• **Bug Hunting** - Submit bugs, view bounties, track status\n• **Security Analysis** - Understand vulnerability types\n• **Platform Features** - Communities, leaderboards, certificates\n• **Code Examples** - Firebase integration, form submissions\n• **Admin Panel** - Access admin tools (admin users only)\n\nTry: 'Navigate to feed' or 'Go to admin panel'",
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

  // Navigation function with admin panel support
  const handleNavigation = (userInput: string) => {
    const input = userInput.toLowerCase()
    
    // Regular user navigation routes
    const navigationMap = {
      'feed': '/feed',
      'dashboard': '/dashboard',
      'profile': '/profile',
      'submissions': '/my-submissions',
      'submit': '/submit',
      'communities': '/communities',
      'leaderboard': '/leaderboard',
      'certificates': '/certificates',
      'settings': '/settings',
      'bug hunt': '/bug-hunt',
      'setup profile': '/setup-profile'
    }
    
    // Admin-only navigation routes
    const adminNavigationMap = {
      'admin panel': '/admin/submissions',
      'admin dashboard': '/admin/submissions',
      'admin submissions': '/admin/submissions',
      'admin bug hunts': '/admin/bug-hunts',
      'admin migration': '/admin-migration',
      'admin utils': '/admin-utils',
      'admin test': '/admin-test',
      'manage submissions': '/admin/submissions',
      'manage bug hunts': '/admin/bug-hunts',
      'user migration': '/admin-migration',
      'admin tools': '/admin-utils'
    }
    
    // Check for admin navigation first (if user is admin)
    if (user?.role === 'admin') {
      for (const [key, path] of Object.entries(adminNavigationMap)) {
        if (input.includes(key) && (input.includes('navigate') || input.includes('go to') || input.includes('take me') || input.includes('open') || input.includes('show'))) {
          router.push(path)
          return `🛡️ Navigating to Admin ${key.replace('admin ', '').charAt(0).toUpperCase() + key.replace('admin ', '').slice(1)}...`
        }
      }
    }
    
    // Regular navigation for all users
    for (const [key, path] of Object.entries(navigationMap)) {
      if (input.includes(key) && (input.includes('navigate') || input.includes('go to') || input.includes('take me') || input.includes('open') || input.includes('show'))) {
        router.push(path)
        return `🚀 Navigating to ${key.charAt(0).toUpperCase() + key.slice(1)}...`
      }
    }
    
    // If admin tried to access admin features but not an admin
    if (!user || user.role !== 'admin') {
      const adminKeywords = ['admin', 'manage', 'migration', 'utils']
      if (adminKeywords.some(keyword => input.includes(keyword))) {
        return `🔒 Admin access required! Only administrators can access admin panel features. Current role: ${user?.role || 'guest'}`
      }
    }
    
    return null
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputMessage.trim()
    setInputMessage("")
    setIsLoading(true)
    
    // Check for navigation first
    const navigationResponse = handleNavigation(currentInput)
    if (navigationResponse) {
      const navMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: navigationResponse,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, navMessage])
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("https://bughuntr.onrender.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          session_id: "bughuntr-session",
          context: "BugHuntr Platform Assistant",
          platform_features: [
            "bug submission", "vulnerability analysis", "bounty hunting",
            "security research", "community forums", "leaderboards",
            "certificates", "admin panels", "Firebase integration"
          ]
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
        content: "🔧 I'm experiencing technical difficulties. As your BugHuntr Assistant, I can still help with:\n\n• Type 'navigate to [page]' for quick navigation\n• Ask about bug submission process\n• Request Firebase code examples\n• Get help with platform features",
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
    // Handle bullet points and formatting
    const lines = content.split('\n')
    
    return lines.map((line, lineIndex) => {
      // Check if line contains code blocks
      if (line.includes('```')) {
        const codeMatch = line.match(/```(\w+)?([\s\S]*?)```/)
        if (codeMatch) {
          return (
            <pre key={lineIndex} className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs mt-1 mb-1 overflow-x-auto">
              <code>{codeMatch[2]}</code>
            </pre>
          )
        }
      }
      
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={lineIndex} className="flex items-start gap-1 my-1">
            <span className="text-cyan-400 font-bold mt-0.5">•</span>
            <span className="flex-1">{line.replace(/^[•-]\s*/, '')}</span>
          </div>
        )
      }
      
      // Handle bold text **text**
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return (
          <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? (
                <strong key={partIndex} className="font-semibold">{part}</strong>
              ) : (
                <span key={partIndex}>{part}</span>
              )
            )}
          </div>
        )
      }
      
      // Regular text
      return line.trim() ? (
        <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
          {line}
        </div>
      ) : (
        <div key={lineIndex} className="h-2"></div>
      )
    })
  }

  if (!isOpen) {
    return (
      <motion.div
        className="fixed bottom-4 right-4 z-50"
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
        className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card className={`w-80 sm:w-96 shadow-xl border-2 ${isMinimized ? 'h-16' : 'h-[min(500px,calc(100vh-8rem))]'} overflow-hidden`}>
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
            <CardContent className="p-0 flex flex-col h-[calc(100%-80px)] overflow-hidden">
              <ScrollArea className="flex-1 p-4 overflow-y-auto chatbot-scrollarea">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!message.isUser && (
                        <Avatar className="h-8 w-8 bg-cyber-blue text-white flex-shrink-0 mt-0.5">
                          <AvatarFallback className="bg-cyber-blue text-white text-xs">
                            <Shield className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[220px] sm:max-w-[260px] rounded-lg p-3 break-words ${
                          message.isUser
                            ? "bg-cyber-blue text-white ml-auto"
                            : "bg-muted/80 text-foreground border"
                        }`}
                        style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
                      >
                        <div className="text-sm leading-relaxed">{formatMessageContent(message.content)}</div>
                        <div className={`text-xs mt-2 opacity-60 font-mono ${
                          message.isUser ? "text-blue-100 text-right" : "text-muted-foreground"
                        }`}>
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      {message.isUser && (
                        <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                          <AvatarFallback className="bg-gradient-to-br from-cyber-blue to-neon-green text-white text-xs font-semibold">
                            U
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8 bg-cyber-blue text-white flex-shrink-0 mt-0.5">
                        <AvatarFallback className="bg-cyber-blue text-white text-xs">
                          <Shield className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted/80 border rounded-lg p-3 max-w-[180px]">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-cyber-blue" />
                          <span className="text-sm text-muted-foreground">Analyzing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-background flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Navigate to feed, admin panel, submit bug..."
                    disabled={isLoading}
                    className="flex-1 min-w-0"
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
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span className="font-medium">BugHuntr Specialist</span>
                  </span>
                  <span className="mx-1">•</span>
                  <span>Navigation & Security Help</span>
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}