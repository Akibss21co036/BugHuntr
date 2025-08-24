"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, CheckCircle, XCircle, DollarSign, Calendar } from "lucide-react"

interface ProfileStatsProps {
  user: {
    totalReports: number
    validReports: number
    duplicateReports: number
    averageBounty: number
    totalEarnings: number
  }
}

export function ProfileStats({ user }: ProfileStatsProps) {
  const successRate = Math.round((user.validReports / user.totalReports) * 100)
  const monthlyEarnings = [
    { month: "Jan", amount: 2400 },
    { month: "Feb", amount: 1800 },
    { month: "Mar", amount: 3200 },
    { month: "Apr", amount: 2800 },
    { month: "May", amount: 1600 },
    { month: "Jun", amount: 2200 },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neon-green">{successRate}%</div>
          <Progress value={successRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {user.validReports} valid out of {user.totalReports} reports
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Bounty</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyber-blue">${user.averageBounty}</div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3 text-neon-green" />
            <span className="text-xs text-neon-green">+12% from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Report Status</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-neon-green" />
                <span className="text-sm">Valid</span>
              </div>
              <Badge variant="secondary">{user.validReports}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-3 w-3 text-severity-medium" />
                <span className="text-sm">Duplicate</span>
              </div>
              <Badge variant="outline">{user.duplicateReports}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32 gap-2">
            {monthlyEarnings.map((data, index) => (
              <div key={data.month} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="w-full bg-cyber-blue/20 rounded-t-sm relative overflow-hidden"
                  style={{ height: `${(data.amount / 3200) * 100}%` }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-cyber-blue rounded-t-sm transition-all duration-500"
                    style={{
                      height: "100%",
                      animationDelay: `${index * 100}ms`,
                    }}
                  />
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium">${data.amount}</div>
                  <div className="text-xs text-muted-foreground">{data.month}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
