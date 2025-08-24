"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Award, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CertificateCardProps {
  certificate: {
    id: number
    title: string
    issuer: string
    issueDate: string
    expiryDate: string
    status: "active" | "expiring" | "expired"
  }
  isSelected: boolean
  onClick: () => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-neon-green/10 text-neon-green border-neon-green/30"
    case "expiring":
      return "bg-neon-orange/10 text-neon-orange border-neon-orange/30"
    case "expired":
      return "bg-severity-high/10 text-severity-high border-severity-high/30"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <Award className="h-3 w-3" />
    case "expiring":
      return <AlertTriangle className="h-3 w-3" />
    case "expired":
      return <AlertTriangle className="h-3 w-3" />
    default:
      return <Award className="h-3 w-3" />
  }
}

export function CertificateCard({ certificate, isSelected, onClick }: CertificateCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-cyber-blue border-cyber-blue/50",
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{certificate.title}</CardTitle>
          <Badge className={cn("gap-1", getStatusColor(certificate.status))}>
            {getStatusIcon(certificate.status)}
            {certificate.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{certificate.issuer}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Issued: {new Date(certificate.issueDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Expires: {new Date(certificate.expiryDate).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
