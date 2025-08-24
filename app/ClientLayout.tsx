"use client"

import type React from "react"
import { useState } from "react"
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

  return (
    <div className="flex h-screen bg-background">
      {isAuthenticated && <Sidebar />}

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {isAuthenticated && <MobileNavigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
    </div>
  )
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
              <InnerLayout>{children}</InnerLayout>
            </CommunityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
