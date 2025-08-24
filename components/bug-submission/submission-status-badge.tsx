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
          color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          icon: <Clock className="h-3 w-3" />,
          label: "Pending Review",
        }
      case "under-review":
        return {
          color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          icon: <Eye className="h-3 w-3" />,
          label: "Under Review",
        }
      case "approved":
        return {
          color: "bg-green-500/10 text-green-500 border-green-500/20",
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Approved",
        }
      case "rejected":
        return {
          color: "bg-red-500/10 text-red-500 border-red-500/20",
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
