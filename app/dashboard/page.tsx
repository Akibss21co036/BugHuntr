"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  DollarSign,
  Bug,
  Shield,
  Trophy,
  Clock,
  Target,
  ArrowUpRight,
  Award,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { motion } from "framer-motion"
import { FadeIn } from "@/components/animations/fade-in"
import { StaggerContainer } from "@/components/animations/stagger-container"
import { Leaderboard } from "@/components/ranking/leaderboard"
import Link from "next/link"

const stats = [
  {
    title: "Total Earnings",
    value: "$12,450",
    change: "+23.5%",
    changeType: "positive" as const,
    icon: DollarSign,
    description: "This month",
  },
  {
    title: "Bug Reports",
    value: "23",
    change: "+12%",
    changeType: "positive" as const,
    icon: Bug,
    description: "Active reports",
  },
  {
    title: "Success Rate",
    value: "87%",
    change: "+5.2%",
    changeType: "positive" as const,
    icon: Target,
    description: "Accepted reports",
  },
  {
    title: "Rank",
    value: "#247",
    change: "↑15",
    changeType: "positive" as const,
    icon: Trophy,
    description: "Global ranking",
  },
]

const recentReports = [
  {
    id: "1",
    title: "SQL Injection in User Profile",
    company: "TechCorp",
    severity: "Critical",
    status: "Under Review",
    bounty: "$2,500",
    submittedAt: "2 hours ago",
  },
  {
    id: "2",
    title: "XSS Vulnerability in Comments",
    company: "StartupXYZ",
    severity: "High",
    status: "Accepted",
    bounty: "$1,200",
    submittedAt: "1 day ago",
  },
  {
    id: "3",
    title: "CSRF Token Bypass",
    company: "FinanceApp",
    severity: "Medium",
    status: "Triaging",
    bounty: "$800",
    submittedAt: "3 days ago",
  },
]

const upcomingDeadlines = [
  {
    title: "TechCorp Bug Bounty Program",
    deadline: "5 days left",
    maxBounty: "$10,000",
  },
  {
    title: "CryptoExchange Security Challenge",
    deadline: "12 days left",
    maxBounty: "$25,000",
  },
  {
    title: "E-commerce Platform Audit",
    deadline: "18 days left",
    maxBounty: "$5,000",
  },
]

const mockCertificates = [
  {
    id: 1,
    title: "Web Application Security Expert",
    issuer: "CyberSec Institute",
    issueDate: "2024-01-15",
    expiryDate: "2025-01-15",
    credentialId: "WSE-2024-001247",
    skills: ["SQL Injection", "XSS", "CSRF", "Authentication Bypass"],
    verificationUrl: "https://verify.cybersec.institute/WSE-2024-001247",
    status: "active",
  },
  {
    id: 2,
    title: "API Security Specialist",
    issuer: "SecureAPI Corp",
    issueDate: "2023-11-20",
    expiryDate: "2024-11-20",
    credentialId: "API-2023-005891",
    skills: ["REST API Security", "GraphQL", "OAuth", "Rate Limiting"],
    verificationUrl: "https://verify.secureapi.corp/API-2023-005891",
    status: "expiring",
  },
  {
    id: 3,
    title: "Mobile Security Researcher",
    issuer: "MobileSec Academy",
    issueDate: "2023-08-10",
    expiryDate: "2023-08-10",
    credentialId: "MSR-2023-003456",
    skills: ["iOS Security", "Android Security", "Mobile App Testing"],
    verificationUrl: "https://verify.mobilesec.academy/MSR-2023-003456",
    status: "expired",
  },
]

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    case "high":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20"
    case "medium":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    case "low":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "accepted":
      return "bg-green-500/10 text-green-500 border-green-500/20"
    case "under review":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "triaging":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    case "rejected":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

const getCertificateStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-500/10 text-green-500 border-green-500/20"
    case "expiring":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    case "expired":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, John! Here's your bug hunting overview.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-cyber-blue/10 text-cyber-blue border-cyber-blue/20">
                <Shield className="w-3 h-3 mr-1" />
                Pro Hunter
              </Badge>
            </div>
          </div>
        </FadeIn>

        {/* Stats Grid */}
        <StaggerContainer>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div key={stat.title} className="h-full">
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-cyber-blue/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <Icon className="h-4 w-4 text-cyber-blue" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="flex items-center gap-1 text-xs">
                        <span
                          className={`font-medium ${
                            stat.changeType === "positive" ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {stat.change}
                        </span>
                        <span className="text-muted-foreground">{stat.description}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </StaggerContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Reports */}
          <div className="lg:col-span-2 space-y-6">
            <FadeIn delay={0.2}>
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">Recent Reports</CardTitle>
                      <CardDescription>Your latest bug submissions</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      View All
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-cyber-blue/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-foreground truncate">{report.title}</h4>
                          <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{report.company}</span>
                          <Badge variant="outline" className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <span>{report.submittedAt}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-cyber-blue">{report.bounty}</div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>

            {/* Certificates */}
            <FadeIn delay={0.3}>
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        My Certificates
                      </CardTitle>
                      <CardDescription>Your security certifications and credentials</CardDescription>
                    </div>
                    <Link href="/certificates">
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        View All
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockCertificates.slice(0, 2).map((cert, index) => (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-cyber-blue/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-foreground truncate">{cert.title}</h4>
                          <Badge className={getCertificateStatusColor(cert.status)}>{cert.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{cert.issuer}</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Expires {new Date(cert.expiryDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cert.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {cert.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{cert.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={cert.verificationUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Top Hunters Leaderboard */}
            <FadeIn delay={0.3}>
              <Leaderboard limit={5} showFullStats={false} />
            </FadeIn>

            {/* Monthly Progress */}
            <FadeIn delay={0.4}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">Monthly Progress</CardTitle>
                  <CardDescription>Your goal: $15,000</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium text-foreground">$12,450</span>
                    </div>
                    <Progress value={83} className="h-2" />
                    <div className="text-xs text-muted-foreground">83% of monthly goal</div>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-muted-foreground">On track to exceed goal</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Upcoming Deadlines */}
            <FadeIn delay={0.5}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">Upcoming Deadlines</CardTitle>
                  <CardDescription>Don't miss these opportunities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingDeadlines.map((deadline, index) => (
                    <motion.div
                      key={deadline.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">{deadline.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {deadline.deadline}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-cyber-blue">{deadline.maxBounty}</div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  )
}
