"use client"

import { useAuth } from "@/components/auth/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

const protectedRoutes = [
  "/dashboard",
  "/feed", 
  "/submit",
  "/my-submissions",
  "/profile",
  "/settings",
  "/certificates",
  "/communities",
  "/community",
  "/bug-hunt",
  "/admin"
]

const publicRoutes = [
  "/",
  "/login", 
  "/signup",
  "/docs",
  "/leaderboard",
  "/bug"
]

export function RouteProtection({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    
    // Check if current route is protected
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    // If user is not authenticated and trying to access protected route
    if (isProtectedRoute && !isAuthenticated) {
      router.push("/")
      return
    }
    
    // If user is authenticated and on login/signup, redirect to feed
    if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
      router.push("/feed")
      return
    }
  }, [isAuthenticated, pathname, router])

  return <>{children}</>
}