"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Award, DollarSign, Clock } from "lucide-react"

interface ProfileActivityProps {
  activities: Array<{
    id: number
    type: "report" | "certificate"
    title: string
    company: string
    bounty?: number
    date: string
    status: string
  }>
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "report":
      return <FileText className="h-4 w-4" />
    case "certificate":
      return <Award className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "bg-neon-green/10 text-neon-green border-neon-green/30"
    case "issued":
      return "bg-cyber-blue/10 text-cyber-blue border-cyber-blue/30"
    case "pending":
      return "bg-neon-orange/10 text-neon-orange border-neon-orange/30"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export function ProfileActivity({ activities }: ProfileActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-cyber-blue/10 rounded-full text-cyber-blue">
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 space-y-1">
                <h4 className="font-medium">{activity.title}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{activity.company}</span>
                  {activity.bounty && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-neon-green">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-semibold">{activity.bounty.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{activity.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
