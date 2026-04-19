import { Badge } from "@/components/ui/badge"
import { Clock, Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import type { BugSubmission } from "@/types/bug-submission"

interface SubmissionStatusBadgeProps {
  status: BugSubmission["status"]
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

export function SubmissionStatusBadge({ status, size = "md", showIcon = true }: SubmissionStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color: "bg-[color:color-mix(in_srgb,var(--medium)_12%,transparent)] text-[var(--medium)] border-[color:color-mix(in_srgb,var(--medium)_25%,transparent)]",
          icon: <Clock className="h-3 w-3" />,
          label: "Pending Review",
        }
      case "under-review":
        return {
          color: "bg-[var(--accent-soft)] text-primary border-[var(--border-light)]",
          icon: <Eye className="h-3 w-3" />,
          label: "Under Review",
        }
      case "approved":
        return {
          color: "bg-[color:color-mix(in_srgb,var(--low)_12%,transparent)] text-[var(--low)] border-[color:color-mix(in_srgb,var(--low)_25%,transparent)]",
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Approved",
        }
      case "rejected":
        return {
          color: "bg-[color:color-mix(in_srgb,var(--critical)_12%,transparent)] text-[var(--critical)] border-[color:color-mix(in_srgb,var(--critical)_25%,transparent)]",
          icon: <XCircle className="h-3 w-3" />,
          label: "Rejected",
        }
      default:
        return {
          color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
          icon: <AlertTriangle className="h-3 w-3" />,
          label: "Unknown",
        }
    }
  }

  const config = getStatusConfig(status)
  const sizeClass = size === "sm" ? "text-xs px-2 py-1" : size === "lg" ? "text-sm px-3 py-2" : "text-xs px-2 py-1"

  return (
    <Badge className={`${config.color} ${sizeClass} flex items-center gap-1`}>
      {showIcon && config.icon}
      <span>{config.label}</span>
    </Badge>
  )
}
