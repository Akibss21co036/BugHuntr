"use client"

import React, { useState } from "react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-context"
import { CommunityProvider } from "@/hooks/use-community"
import { TopNavbar } from "@/components/navigation/top-navbar"
import { Sidebar } from "@/components/navigation/sidebar"
import { MobileNavigation } from "@/components/navigation/mobile-navigation"
import { useAuth } from "@/components/auth/auth-context"
import "./globals.css"

function InnerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isLandingPage, setIsLandingPage] = useState(false)

  // Only run client-only logic after mount
  React.useEffect(() => {
    setMounted(true)
    setIsLandingPage(window.location.pathname === '/')
  }, [])

  if (!mounted) {
    // Render nothing until mounted to avoid hydration mismatch
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      {!isLandingPage && isAuthenticated && <Sidebar />}

      <div className="flex-1 flex flex-col">
        {/* Always show TopNavbar, even on landing page */}
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto" style={{ scrollBehavior: 'smooth' }}>{children}</main>
      </div>

      {!isLandingPage && isAuthenticated && <MobileNavigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
    </div>
  )
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { SearchProvider } = require("@/components/search/search-context");
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CommunityProvider>
              <SearchProvider>
                <InnerLayout>{children}</InnerLayout>
              </SearchProvider>
            </CommunityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
