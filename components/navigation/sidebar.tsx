"use client"

import { Button } from "@/components/ui/button"
import {
  Home,
  Bug,
  FileText,
  Award,
  Shield,
  Settings,
  X,
  Hash,
  Plus,
  ChevronDown,
  ChevronRight,
  Users,
  Target,
  ClipboardList,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/auth-context"
import { useRanking } from "@/hooks/use-ranking"
import { RankBadge } from "@/components/ranking/rank-badge"
import { useCommunity } from "@/hooks/use-community"
import { useState } from "react"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { getUserRanking } = useRanking()
  const { joinedCommunities, currentCommunity, setCurrentCommunity } = useCommunity()
  const [expandedCommunities, setExpandedCommunities] = useState<string[]>([])

  const userRanking = user ? getUserRanking(user.id) : null

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
    { id: "bug-feed", label: "Bug Feed", icon: Bug, href: "/feed" },
    {
      id: "submit-bug",
      label: user?.role === "admin" ? "Create a Bug Hunt" : "Submit Bug",
      icon: user?.role === "admin" ? Target : FileText,
      href: "/submit",
    },
    ...(user?.role === "admin"
      ? [
          {
            id: "admin-submissions",
            label: "Review Submissions",
            icon: ClipboardList,
            href: "/admin/submissions",
          },
        ]
      : [
          {
            id: "my-submissions",
            label: "My Submissions",
            icon: FileText,
            href: "/my-submissions",
          },
        ]),
    { id: "leaderboard", label: "Leaderboard", icon: Award, href: "/leaderboard" },
    { id: "my-reports", label: "My Reports", icon: FileText, href: "/reports" },
    { id: "communities", label: "Communities", icon: Users, href: "/communities" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ]

  const toggleCommunityExpansion = (communityId: string) => {
    setExpandedCommunities((prev) =>
      prev.includes(communityId) ? prev.filter((id) => id !== communityId) : [...prev, communityId],
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "w-64 bg-sidebar border-r border-sidebar-border",
          "lg:static lg:block",
          "fixed inset-y-0 left-0 z-40",
          isOpen ? "block" : "hidden lg:block",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="flex justify-end p-4 lg:hidden">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="hidden lg:flex items-center px-6 py-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-cyber-blue" />
              <span className="text-xl font-bold text-sidebar-foreground">BugHuntr</span>
              {user?.role === "admin" && (
                <span className="px-2 py-1 text-xs bg-orange-600 text-white rounded-full font-medium">ADMIN</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4 border-b border-sidebar-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                  Communities
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                {joinedCommunities.map((community) => {
                  const isExpanded = expandedCommunities.includes(community.id)
                  const isCurrentCommunity = currentCommunity?.id === community.id

                  return (
                    <div key={community.id}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-2 h-8 text-sm px-2",
                          isCurrentCommunity && "bg-sidebar-accent",
                        )}
                        onClick={() => {
                          setCurrentCommunity(community)
                          toggleCommunityExpansion(community.id)
                        }}
                      >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-cyber-blue to-neon-green flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{community.name.charAt(0)}</span>
                        </div>
                        <span className="truncate">{community.name}</span>
                        {community.isPrivate && <Shield className="h-3 w-3 text-sidebar-foreground/50" />}
                      </Button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-6 space-y-1 overflow-hidden"
                          >
                            {community.channels.map((channel) => (
                              <Link
                                key={channel.id}
                                href={`/community/${community.id}/channel/${channel.id}`}
                                onClick={onClose}
                              >
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start gap-2 h-7 text-xs px-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                                >
                                  <Hash className="h-3 w-3" />
                                  <span className="truncate">{channel.name}</span>
                                </Button>
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>

            <nav className="px-4 py-4 space-y-1">
              <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3">
                Navigation
              </h3>
              {navigationItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={item.href} onClick={onClose}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-10 text-sm font-medium transition-all",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          user?.role === "admin" && item.id === "submit-bug" && "border-l-2 border-orange-500",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
          </div>

          <motion.div
            className="p-4 border-t border-sidebar-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-sidebar-accent rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyber-blue to-neon-green rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.username ? user.username.charAt(0).toUpperCase() : "JD"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.username || "John Doe"}</p>
                  <p className="text-xs text-sidebar-foreground/70">
                    {user?.role === "admin" ? "Administrator" : "@" + (user?.username || "johndoe")}
                  </p>
                </div>
                {userRanking && <RankBadge rank={userRanking.rank} size="sm" />}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-cyber-blue">{userRanking ? `#${userRanking.rank}` : "#247"}</div>
                  <div className="text-sidebar-foreground/70">Rank</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-neon-green">
                    ${userRanking ? (userRanking.totalEarnings / 1000).toFixed(1) : "12.4"}K
                  </div>
                  <div className="text-sidebar-foreground/70">Earned</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-cyber-cyan">{userRanking?.bugsFound || 23}</div>
                  <div className="text-sidebar-foreground/70">Reports</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </aside>
    </>
  )
}
