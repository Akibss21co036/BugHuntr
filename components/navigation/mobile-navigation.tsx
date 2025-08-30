"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Bug, FileText, Trophy, Settings, User, X, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "bug-feed", label: "Bug Feed", icon: Bug, href: "/" },
  { id: "my-reports", label: "My Reports", icon: FileText, href: "/reports" },
  { id: "certificates", label: "Certificates", icon: Trophy, href: "/certificates" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
]

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const pathname = usePathname()

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-cyber-blue" />
              <span className="text-lg font-bold bg-gradient-to-r from-cyber-blue to-cyber-cyan bg-clip-text text-transparent">
                BugHuntr
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link key={item.id} href={item.href} onClick={onClose}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-12 text-left",
                        isActive && "bg-cyber-blue/10 text-cyber-blue border-r-2 border-cyber-blue",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback className="bg-cyber-blue text-white">JD</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">Security Researcher</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
