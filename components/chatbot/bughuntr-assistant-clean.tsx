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
  Shield,
  Minimize2,
  Maximize2,
  Navigation,
  Settings,
  Award,
  Users,
  Bug,
  Target,
  Loader2,
  BookOpen
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

export function BugHuntrAssistant() {
  const router = useRouter()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: `🛡️ **Welcome to BugHuntr Assistant!**

I'm your comprehensive cybersecurity and platform guide. I can help you with:

**🚀 Navigation**
• Quick access to any page
• User & Admin panel routes
• Platform features overview

**🔍 Platform Information**
• Bug hunting process
• Submission guidelines
• Community features
• Leaderboards & certificates

**🎓 Cybersecurity Education**
• Bug bounty concepts
• Vulnerability types (XSS, SQL injection, CSRF, etc.)
• Security standards (OWASP Top 10)
• Ethical hacking & responsible disclosure
• Penetration testing fundamentals

**💡 Getting Started**
Try: "What is a bug bounty?", "Explain XSS", "Navigate to feed", or "How to submit a bug"

${user?.role === 'admin' ? '🔑 **Admin Access Detected** - Full platform access available!' : '👤 **User Mode** - Standard platform features available'}`,
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleNavigation = (userInput: string) => {
    const input = userInput.toLowerCase()
    
    // Navigation routes for users
    const userRoutes = {
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
    
    // Admin-only routes
    const adminRoutes = {
      'admin panel': '/admin/submissions',
      'admin dashboard': '/admin/submissions',
      'admin submissions': '/admin/submissions',
      'admin bug hunts': '/admin/bug-hunts',
      'admin migration': '/admin-migration',
      'admin utils': '/admin-utils',
      'admin test': '/admin-test',
      'manage submissions': '/admin/submissions',
      'manage bug hunts': '/admin/bug-hunts'
    }
    
    // Check for admin navigation (admin users only)
    if (user?.role === 'admin') {
      for (const [key, path] of Object.entries(adminRoutes)) {
        if (input.includes(key) && (input.includes('navigate') || input.includes('go to') || input.includes('open') || input.includes('show'))) {
          router.push(path)
          return `🔑 **Admin Navigation** - Taking you to ${key}...`
        }
      }
    }
    
    // Standard user navigation
    for (const [key, path] of Object.entries(userRoutes)) {
      if (input.includes(key) && (input.includes('navigate') || input.includes('go to') || input.includes('open') || input.includes('show'))) {
        router.push(path)
        return `🚀 **Navigating** to ${key.charAt(0).toUpperCase() + key.slice(1)}...`
      }
    }
    
    // Handle admin access requests for non-admin users
    if (user?.role !== 'admin' && input.includes('admin')) {
      return `🔒 **Admin Access Required**\n\nOnly administrators can access admin features. Your current role: ${user?.role || 'guest'}\n\nContact an admin for elevated permissions.`
    }
    
    return null
  }

  const getPlatformInfo = (userInput: string) => {
    const input = userInput.toLowerCase()
    
    // Bug bounty and security concepts
    if (input.includes('bug bounty') || input.includes('bugbounty') || input.includes('what is bug bounty')) {
      return `🎯 **What is a Bug Bounty?**

**Definition**: A bug bounty is a reward offered by organizations to security researchers who find and responsibly disclose vulnerabilities in their systems.

**🔍 How It Works**:
• **Discovery** - Researchers find security flaws
• **Responsible Disclosure** - Report vulnerabilities privately
• **Validation** - Organization confirms the issue
• **Reward** - Researcher receives monetary compensation
• **Fix** - Organization patches the vulnerability

**💰 Benefits for Organizations**:
• Cost-effective security testing
• Fresh perspective from diverse researchers
• Continuous security assessment
• Improved security posture

**🛡️ Benefits for Researchers**:
• Monetary rewards for findings
• Legal protection under responsible disclosure
• Skill development and recognition
• Contributing to internet security

**🌍 Industry Impact**:
Bug bounties have become essential for major tech companies like Google, Microsoft, Facebook, and thousands of others.`
    }

    if (input.includes('vulnerability') || input.includes('vulnerabilities') || input.includes('security flaw')) {
      return `🔓 **Understanding Vulnerabilities**

**What is a Vulnerability?**
A weakness in a system that can be exploited to gain unauthorized access or cause harm.

**🎯 Common Vulnerability Types**:

**🌐 Web Application**:
• **XSS (Cross-Site Scripting)** - Malicious scripts in web pages
• **SQL Injection** - Database manipulation attacks
• **CSRF** - Cross-Site Request Forgery
• **Authentication Bypass** - Circumventing login systems
• **File Upload Vulnerabilities** - Malicious file execution

**📱 Mobile Security**:
• **Insecure Data Storage** - Sensitive data exposure
• **Weak Authentication** - Poor access controls
• **Code Injection** - Malicious code execution
• **Man-in-the-Middle** - Communication interception

**🏗️ Infrastructure**:
• **Misconfigurations** - Improper system setup
• **Outdated Software** - Unpatched security holes
• **Weak Passwords** - Easy-to-guess credentials
• **Open Ports** - Unnecessary network access points

**📊 Severity Levels**:
• **Critical** - Remote code execution, data breach
• **High** - Privilege escalation, sensitive data access
• **Medium** - Limited access, information disclosure
• **Low** - Minor security concerns, limited impact`
    }

    if (input.includes('responsible disclosure') || input.includes('ethical hacking') || input.includes('white hat')) {
      return `⚖️ **Responsible Disclosure & Ethical Hacking**

**🤝 Responsible Disclosure**:
The practice of reporting security vulnerabilities to organizations privately before public disclosure.

**📋 Key Principles**:
• **Private Reporting** - Contact organization first
• **Reasonable Timeline** - Allow time for fixes (typically 90 days)
• **No Harm** - Don't exploit or damage systems
• **Documentation** - Provide clear reproduction steps
• **Coordination** - Work with security teams

**🎩 Ethical Hacking vs. Malicious Hacking**:

**✅ White Hat (Ethical)**:
• Permission-based testing
• Responsible disclosure
• Helping improve security
• Legal protection
• Constructive intent

**❌ Black Hat (Malicious)**:
• Unauthorized access
• Criminal intent
• Data theft or damage
• Illegal activities
• Destructive purpose

**🛡️ Legal Protections**:
• Bug bounty programs provide legal safe harbor
• Responsible disclosure laws protect researchers
• Clear scope and rules define acceptable testing

**🎯 Best Practices**:
• Always get permission before testing
• Follow program rules and scope
• Document everything thoroughly
• Respect user privacy and data
• Report findings promptly`
    }

    if (input.includes('owasp') || input.includes('top 10') || input.includes('security standards')) {
      return `📚 **OWASP & Security Standards**

**🌍 OWASP (Open Web Application Security Project)**:
A nonprofit organization focused on improving software security through open-source tools, standards, and education.

**🔟 OWASP Top 10 (2021)**:
The most critical web application security risks:

**1. Broken Access Control** - Improper user permissions
**2. Cryptographic Failures** - Weak encryption/hashing
**3. Injection** - SQL, NoSQL, OS command injection
**4. Insecure Design** - Security flaws in architecture
**5. Security Misconfiguration** - Default/weak configs
**6. Vulnerable Components** - Outdated libraries
**7. Authentication Failures** - Weak login systems
**8. Software Integrity Failures** - Unsigned code
**9. Logging/Monitoring Failures** - Poor detection
**10. Server-Side Request Forgery** - SSRF attacks

**📖 Other OWASP Resources**:
• **OWASP Testing Guide** - Comprehensive security testing
• **OWASP Code Review Guide** - Secure code practices
• **OWASP Mobile Top 10** - Mobile security risks
• **OWASP API Security Top 10** - API vulnerabilities

**🛠️ Security Testing Tools**:
• **OWASP ZAP** - Web app security scanner
• **Burp Suite** - Web vulnerability scanner
• **Nmap** - Network discovery tool
• **Metasploit** - Penetration testing framework

**🎓 Learning Resources**:
Security research requires continuous learning about new attack vectors and defense mechanisms.`
    }

    if (input.includes('penetration testing') || input.includes('pentest') || input.includes('security testing')) {
      return `🎯 **Penetration Testing & Security Assessment**

**🔍 What is Penetration Testing?**
A simulated cyberattack against systems to find vulnerabilities before real attackers do.

**🎭 Types of Penetration Testing**:

**📦 Black Box Testing**:
• No prior knowledge of system
• Simulates external attacker
• Tests from outside perspective
• Limited information provided

**🔘 Gray Box Testing**:
• Partial system knowledge
• Simulates insider threat
• Combines internal/external views
• Some credentials provided

**📋 White Box Testing**:
• Full system knowledge
• Complete access to documentation
• Source code review
• Internal security assessment

**🎯 Testing Phases**:
**1. Reconnaissance** - Information gathering
**2. Scanning** - Identifying live systems
**3. Enumeration** - Detailed service analysis
**4. Vulnerability Assessment** - Finding weaknesses
**5. Exploitation** - Attempting to exploit flaws
**6. Post-Exploitation** - Assessing impact
**7. Reporting** - Documenting findings

**🛠️ Common Tools**:
• **Nmap** - Network scanning
• **Burp Suite** - Web app testing
• **Metasploit** - Exploitation framework
• **Wireshark** - Network analysis
• **Nikto** - Web server scanner
• **John the Ripper** - Password cracking

**📊 Deliverables**:
• Executive summary
• Technical findings
• Risk assessment
• Remediation recommendations
• Proof of concept demonstrations`
    }

    if (input.includes('cve') || input.includes('nvd') || input.includes('vulnerability database')) {
      return `📊 **CVE & Vulnerability Databases**

**🆔 CVE (Common Vulnerabilities and Exposures)**:
A standardized identifier system for publicly known cybersecurity vulnerabilities.

**📋 CVE Format**: CVE-YYYY-NNNN
• **CVE** - Common Vulnerabilities and Exposures
• **YYYY** - Year of assignment
• **NNNN** - Sequential number

**🌐 Key Databases**:

**📚 NVD (National Vulnerability Database)**:
• US government repository
• CVSS scoring system
• Detailed vulnerability analysis
• Reference links and patches

**🔍 Other Important Databases**:
• **MITRE CVE List** - Original CVE authority
• **Exploit Database** - Proof-of-concept exploits
• **VulnDB** - Commercial vulnerability database
• **Rapid7 VulnDB** - Comprehensive vulnerability data

**📈 CVSS (Common Vulnerability Scoring System)**:
Standardized method for rating vulnerability severity (0.0-10.0):

• **0.1-3.9**: Low
• **4.0-6.9**: Medium  
• **7.0-8.9**: High
• **9.0-10.0**: Critical

**🎯 CVSS Metrics**:
• **Attack Vector** - How vulnerability is exploited
• **Attack Complexity** - Difficulty of exploitation
• **Privileges Required** - Access level needed
• **User Interaction** - Human involvement required
• **Scope** - Impact beyond vulnerable component
• **Impact** - Effect on confidentiality, integrity, availability

**💡 Why CVEs Matter**:
• Standardized vulnerability tracking
• Risk assessment and prioritization
• Patch management coordination
• Security tool integration
• Industry communication standard`
    }

    // Existing platform info...
    if (input.includes('platform overview') || input.includes('about platform')) {
      return `🏆 **BugHuntr Platform Overview**

**🎯 Mission**: Connecting security researchers with organizations to find and fix vulnerabilities

**✨ Key Features**:
• **Bug Bounty System** - Submit vulnerabilities, earn rewards
• **Community Driven** - Join communities, share knowledge
• **Skill Recognition** - Earn certificates and climb leaderboards
• **Real-time Feed** - Stay updated with latest discoveries
• **Comprehensive Profiles** - Showcase your security expertise

**🔧 Admin Features** (Admin Only):
• Submission management and review
• Bug hunt creation and oversight
• User migration and utilities
• Platform analytics and testing

**👥 User Roles**:
• **Researchers** - Submit bugs, participate in hunts
• **Admins** - Manage platform, review submissions
• **Community Leaders** - Guide and mentor researchers`
    }
    
    if (input.includes('submit') && input.includes('bug')) {
      return `🐛 **Bug Submission Guide**

**📝 Submission Process**:
1. **Discovery** - Find a valid security vulnerability
2. **Documentation** - Detailed write-up with steps to reproduce
3. **Evidence** - Screenshots, proof-of-concept code
4. **Submission** - Use our submit form with severity assessment
5. **Review** - Admin team validates and assigns bounty

**🎯 What to Include**:
• Clear vulnerability description
• Impact assessment (Low/Medium/High/Critical)
• Steps to reproduce
• Affected systems/components
• Recommended fixes

**💰 Bounty Ranges**:
• **Critical**: $500-$2000+
• **High**: $200-$500
• **Medium**: $50-$200
• **Low**: $10-$50

Ready to submit? Say "Navigate to submit"`
    }
    
    if (input.includes('communities') || input.includes('community')) {
      return `👥 **Community Features**

**🌟 Join Communities**:
• **Web Application Security** - Focus on web vulnerabilities
• **Mobile Security** - iOS/Android security research
• **Network Security** - Infrastructure and network bugs
• **IoT Security** - Connected device vulnerabilities
• **Cloud Security** - AWS, Azure, GCP security issues

**💡 Community Benefits**:
• Knowledge sharing and mentorship
• Exclusive bug hunt events
• Collaborative research opportunities
• Networking with security professionals
• Access to specialized resources

**🏆 Community Activities**:
• Weekly challenges and CTFs
• Security tool discussions
• Vulnerability research sharing
• Career guidance and tips

Want to explore? Say "Navigate to communities"`
    }
    
    if (input.includes('leaderboard') || input.includes('ranking')) {
      return `🏆 **Leaderboard & Rankings**

**📊 Ranking System**:
• **Points System** - Earn points for valid submissions
• **Severity Multipliers** - Higher severity = more points
• **Monthly Rankings** - Fresh competition every month
• **All-time Leaders** - Hall of fame for top performers

**🎖️ Ranking Tiers**:
• **Novice** (0-99 points) - Starting your journey
• **Researcher** (100-499 points) - Building expertise
• **Expert** (500-1999 points) - Proven skills
• **Elite** (2000-4999 points) - Top tier researcher
• **Legend** (5000+ points) - Security mastery

**🏅 Achievements**:
• First submission milestone
• Critical vulnerability finder
• Community contributor
• Bug hunt champion
• Consistent performer

Check your rank: Say "Navigate to leaderboard"`
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

    // Check for platform information
    const infoResponse = getPlatformInfo(currentInput)
    if (infoResponse) {
      const infoMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: infoResponse,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, infoMessage])
      setIsLoading(false)
      return
    }

    // Use API for more complex queries
    try {
      const response = await fetch("https://bughuntr.onrender.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          session_id: "bughuntr-session"
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
        content: `🤖 **I'm here to help!**

I can assist you with:

**🧭 Navigation Commands**:
• "Navigate to [page]" - Go to any platform section
• "Go to admin panel" - Admin access (admin only)
• "Open submissions" - View your submissions

**📚 Information Requests**:
• "Platform overview" - Complete platform guide
• "How to submit a bug" - Bug submission process
• "Communities info" - Community features
• "Leaderboard info" - Ranking system details

What would you like to explore?`,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessageContent = (content: string) => {
    const lines = content.split('\n')
    
    return lines.map((line, lineIndex) => {
      // Handle bold text **text**
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return (
          <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? (
                <strong key={partIndex} className="font-semibold text-cyan-600 dark:text-cyan-400">{part}</strong>
              ) : (
                <span key={partIndex}>{part}</span>
              )
            )}
          </div>
        )
      }
      
      // Handle bullet points
      if (line.trim().startsWith('•')) {
        return (
          <div key={lineIndex} className="flex items-start gap-2 my-1 ml-2">
            <span className="text-cyan-500 font-bold mt-0.5 text-sm">•</span>
            <span className="flex-1 text-sm">{line.replace(/^•\s*/, '')}</span>
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
          className="h-14 w-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white/20"
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
        <Card className={`w-80 sm:w-96 shadow-2xl border-2 border-cyan-200/50 dark:border-cyan-800/50 ${isMinimized ? 'h-16' : 'h-[min(600px,calc(100vh-8rem))]'} overflow-hidden backdrop-blur-sm bg-white/95 dark:bg-gray-900/95`}>
          <CardHeader className="pb-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">BugHuntr Assistant</CardTitle>
                  <p className="text-xs text-white/80">Your Security Platform Guide</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 transition-colors"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-[calc(100%-90px)] overflow-hidden">
              <ScrollArea className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!message.isUser && (
                        <Avatar className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex-shrink-0 mt-0.5 border-2 border-white/20">
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                            <Shield className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[240px] sm:max-w-[280px] rounded-xl p-3 break-words shadow-sm ${
                          message.isUser
                            ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white ml-auto"
                            : "bg-gray-50 dark:bg-gray-800 text-foreground border border-gray-200 dark:border-gray-700"
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
                        <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5 border-2 border-gray-200 dark:border-gray-700">
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white text-xs font-semibold">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex-shrink-0 mt-0.5 border-2 border-white/20">
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                          <Shield className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
                          <span className="text-sm text-muted-foreground">Analyzing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Action Buttons */}
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                    onClick={() => {
                      if (!isLoading) {
                        setInputMessage("Navigate to feed")
                        // We need to trigger sendMessage after the state update
                        setTimeout(() => sendMessage(), 0)
                      }
                    }}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Feed
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                    onClick={() => {
                      if (!isLoading) {
                        setInputMessage("How to submit a bug")
                        setTimeout(() => sendMessage(), 0)
                      }
                    }}
                  >
                    <Bug className="h-3 w-3 mr-1" />
                    Submit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                    onClick={() => {
                      if (!isLoading) {
                        setInputMessage("What is a bug bounty?")
                        setTimeout(() => sendMessage(), 0)
                      }
                    }}
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    Learn
                  </Button>
                  {user?.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                      onClick={() => {
                        if (!isLoading) {
                          setInputMessage("Navigate to admin panel")
                          setTimeout(() => sendMessage(), 0)
                        }
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Admin
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 border-t bg-background flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && !isLoading && sendMessage()}
                    placeholder={user?.role === 'admin' ? "Navigate, get info, or manage platform..." : "Navigate, submit bugs, or ask questions..."}
                    disabled={isLoading}
                    className="flex-1 min-w-0 border-gray-300 dark:border-gray-600 focus:border-cyan-500 dark:focus:border-cyan-400"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="icon"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span className="font-medium">BugHuntr AI</span>
                    </span>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {user?.role === 'admin' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                        <Award className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                    <span className="text-xs">Online</span>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}