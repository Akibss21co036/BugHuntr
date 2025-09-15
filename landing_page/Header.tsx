"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"

interface HeaderProps {
  isAuthenticated: boolean
}

export const Header = ({ isAuthenticated }: HeaderProps) => {
  const router = useRouter()

  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-cyber-blue" />
          <span className="text-2xl font-bold bg-gradient-to-r from-cyber-blue to-cyber-cyan bg-clip-text text-transparent">
            BugHuntr
          </span>
          <Badge variant="outline" className="border-cyber-blue/30 text-cyber-blue text-xs">
            ELITE
          </Badge>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#community" className="text-muted-foreground hover:text-foreground transition-colors">
            Community
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          {!isAuthenticated ? (
            <>
              <Button 
                variant="ghost" 
                onClick={() => router.push("/login")}
                className="hover:bg-cyber-blue/10"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => router.push("/signup")}
                className="bg-gradient-to-r from-cyber-blue to-cyber-cyan hover:from-cyber-blue/90 hover:to-cyber-cyan/90 text-white"
              >
                Get Started
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => router.push("/dashboard")}
              className="bg-gradient-to-r from-cyber-blue to-cyber-cyan hover:from-cyber-blue/90 hover:to-cyber-cyan/90 text-white"
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}