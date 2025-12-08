"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getDisplayUsername } from "@/lib/extract-username";

interface User {
  id: string;
  username: string;
  email?: string;
  role: "user" | "admin";
  userType: "company" | "hunter";
  companyName?: string;
  companyId?: string;
  companyDomain?: string;
  representativeName?: string;
  twoFactorEnabled?: boolean;
  rank?: "C" | "B" | "A" | "S";
  huntsParticipated?: number;
  certifications?: string[];
  reputation?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, email?: string, role?: "user" | "admin", userType?: "company" | "hunter", additionalData?: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // In development we may want a fresh state, but don't forcibly clear stored user here.
    const authStatus = localStorage.getItem("isAuthenticated");
    const userData = localStorage.getItem("currentUser");
    setIsAuthenticated(authStatus === "true");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (
    username: string,
    email?: string,
    role: "user" | "admin" = "user",
    userType: "company" | "hunter" = "hunter",
    additionalData?: Partial<User>
  ) => {
    const displayUsername = getDisplayUsername(username, email);
    const userData: User = {
      id: displayUsername,
      username: displayUsername,
      email,
      role,
      userType,
      ...additionalData,
    };
    setIsAuthenticated(true);
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("currentUser", JSON.stringify(userData));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("currentUser");
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
