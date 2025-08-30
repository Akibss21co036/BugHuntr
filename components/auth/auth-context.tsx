"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  username: string
  email?: string
  role: "user" | "admin"
  companyName?: string
  companyId?: string
  companyDomain?: string
  representativeName?: string
  twoFactorEnabled?: boolean
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, email?: string, role?: "user" | "admin", companyData?: Partial<User>) => void 
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const authStatus = localStorage.getItem("isAuthenticated")
    const userData = localStorage.getItem("currentUser")

    setIsAuthenticated(authStatus === "true")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const login = (username: string, email?: string, role: "user" | "admin" = "user", companyData?: Partial<User>) => {
    const userData: User = {
      id: username,
      username,
      email,
      role,
      ...companyData,
    }

    setIsAuthenticated(true)
    setUser(userData)
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("currentUser", JSON.stringify(userData))
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("currentUser")
  }

  return <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
