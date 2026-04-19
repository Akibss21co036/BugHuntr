"use client"

import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerificationBadgeProps {
  isAdmin: boolean
  companyName?: string
  size?: "sm" | "md" | "lg"
  className?: string
  compact?: boolean // New prop for compact display
}

export function VerificationBadge({ isAdmin, companyName, size = "sm", className, compact = false }: VerificationBadgeProps) {
  if (!isAdmin) return null

  const sizeClasses = {
    sm: compact ? "w-3 h-3" : "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  // Determine verification text based on company name
  const verificationText = companyName ? `${companyName} Verified` : "Verified"

  // For compact mode, show only the icon
  if (compact) {
    return (
      <div className={cn("flex items-center text-primary", className)}>
        <CheckCircle className={cn("fill-blue-600 text-white stroke-1 stroke-blue-700 drop-shadow-sm", sizeClasses[size])} />
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1.5 text-primary", className)}>
      <CheckCircle className={cn("fill-blue-600 text-white stroke-1 stroke-blue-700 drop-shadow-sm", sizeClasses[size])} />
      <span className={cn("font-semibold whitespace-nowrap text-primary", textSizeClasses[size])}>{verificationText}</span>
    </div>
  )
}