export interface BugHunt {
  id: string
  title: string
  description: string
  company: string
  scope: string[]
  categories: string[]
  difficulty: "beginner" | "intermediate" | "advanced" | "expert"
  status: "draft" | "active" | "paused" | "completed"
  startDate: string
  endDate: string
  maxParticipants?: number
  currentParticipants: number
  createdBy: string
  createdAt: string
  updatedAt: string
  rewards: {
    critical: number
    high: number
    medium: number
    low: number
  }
  rules: string[]
  assets: string[]
  submissions: BugHuntSubmission[]
}

export interface BugHuntSubmission {
  id: string
  huntId: string
  userId: string
  username: string
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  category: string
  proofOfConcept: string
  status: "pending" | "approved" | "rejected" | "duplicate"
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
  pointsAwarded?: number
}

export interface BugHuntTemplate {
  id: string
  name: string
  description: string
  defaultScope: string[]
  defaultCategories: string[]
  defaultRules: string[]
  difficulty: BugHunt["difficulty"]
}

export const BUG_HUNT_TEMPLATES: BugHuntTemplate[] = [
  {
    id: "web_app_basic",
    name: "Web Application Security",
    description: "Standard web application security testing",
    defaultScope: ["*.example.com", "app.example.com", "api.example.com"],
    defaultCategories: ["Web Application", "API Security", "Authentication"],
    defaultRules: [
      "No automated scanning without permission",
      "Report findings immediately upon discovery",
      "Do not access or modify user data",
      "Respect rate limits and avoid DoS attacks",
    ],
    difficulty: "intermediate",
  },
  {
    id: "mobile_app",
    name: "Mobile Application Security",
    description: "Mobile app security assessment",
    defaultScope: ["iOS App", "Android App", "Mobile API"],
    defaultCategories: ["Mobile Application", "API Security", "Data Storage"],
    defaultRules: [
      "Test only on provided test accounts",
      "Do not reverse engineer proprietary algorithms",
      "Report device-specific vulnerabilities",
      "Avoid jailbreaking/rooting production devices",
    ],
    difficulty: "advanced",
  },
  {
    id: "api_security",
    name: "API Security Assessment",
    description: "Focus on API endpoints and security",
    defaultScope: ["api.example.com", "v1.api.example.com", "v2.api.example.com"],
    defaultCategories: ["API Security", "Authentication", "Authorization"],
    defaultRules: [
      "Use only provided API keys",
      "Respect rate limiting",
      "Do not attempt privilege escalation",
      "Test only documented endpoints",
    ],
    difficulty: "intermediate",
  },
]
