"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Search, Menu, Shield, User, LogOut, Settings } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/auth-context"

interface TopNavbarProps {
  onMenuClick: () => void
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { isAuthenticated, logout } = useAuth()

  const handleLogout = () => {
    logout();
    // Redirect to home page
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-cyber-blue" />
            <span className="text-lg font-bold bg-gradient-to-r from-cyber-blue to-cyber-cyan bg-clip-text text-transparent truncate">
              BugHuntr
            </span>
          </div>
        </div>

        <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-2 sm:mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search vulnerabilities..."
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-neon-orange rounded-full animate-pulse"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-6 w-6 sm:h-7 sm:w-7 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src="/placeholder.svg?height=28&width=28" />
                    <AvatarFallback className="bg-cyber-blue text-white text-xs">JD</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild className="bg-cyber-blue hover:bg-cyber-blue/90">
                <Link href="/signup">Sign Up</Link>
              </Button>
              {/* Mobile auth buttons */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/login">Login</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/signup">Sign Up</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
