"use client"

import { Shield, Github, Twitter, Linkedin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Footer = () => {
  return (
    <footer className="bg-background border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-cyber-blue" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyber-blue to-cyber-cyan bg-clip-text text-transparent">
                BugHuntr
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The world's most advanced bug bounty platform for elite security researchers and cybersecurity professionals.
            </p>
          </div>

          {/* Product */}
          <div className="col-span-1">
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/feed" className="hover:text-cyber-blue transition-colors">Bug Feed</a></li>
              <li><a href="/communities" className="hover:text-cyber-blue transition-colors">Communities</a></li>
              <li><a href="/leaderboard" className="hover:text-cyber-blue transition-colors">Leaderboard</a></li>
              <li><a href="/certificates" className="hover:text-cyber-blue transition-colors">Certificates</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/docs" className="hover:text-cyber-blue transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-cyber-blue transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-cyber-blue transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-cyber-blue transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Community */}
          <div className="col-span-1">
            <h3 className="font-semibold text-foreground mb-4">Connect</h3>
            <div className="flex space-x-3 mb-4">
              <Button variant="ghost" size="icon" className="hover:bg-cyber-blue/10">
                <Github className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-cyber-blue/10">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-cyber-blue/10">
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-cyber-blue/10">
                <Mail className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Join our community of elite security researchers
            </p>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 BugHuntr. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built for the cybersecurity community
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}