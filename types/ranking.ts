export interface UserRanking {
  userId: string
  username: string
  totalPoints: number
  rank: RankTier
  bugsFound: number
  totalEarnings: number
  joinDate: string
  weeklyPoints: number
  monthlyPoints: number
  streak: number
  lastActivity: string
  rankProgress: number
  nextRankPoints: number
}

export type RankTier = "E" | "D" | "C" | "B" | "A" | "S"

export interface RankConfig {
  tier: RankTier
  minPoints: number
  maxPoints: number
  color: string
  bgColor: string
  description: string
  benefits: string[]
  weeklyRequirement?: number
}

export interface PointsTransaction {
  id: string
  userId: string
  bugId: number
  points: number
  reason: string
  timestamp: string
  severity: keyof typeof SEVERITY_POINTS
  multiplier?: number
}

export const SEVERITY_POINTS = {
  critical: 1000,
  high: 500,
  medium: 200,
  low: 50,
} as const

export const STREAK_MULTIPLIERS = {
  0: 1.0, // No streak
  3: 1.1, // 3+ days: 10% bonus
  7: 1.2, // 1+ week: 20% bonus
  14: 1.3, // 2+ weeks: 30% bonus
  30: 1.5, // 1+ month: 50% bonus
} as const

export const RANK_CONFIGS: Record<RankTier, RankConfig> = {
  E: {
    tier: "E",
    minPoints: 0,
    maxPoints: 499,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    description: "Novice Bug Hunter",
    benefits: ["Access to basic tutorials", "Community forum access"],
  },
  D: {
    tier: "D",
    minPoints: 500,
    maxPoints: 1499,
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: "Junior Security Researcher",
    benefits: ["Priority support", "Advanced tutorials", "Monthly webinars"],
    weeklyRequirement: 50,
  },
  C: {
    tier: "C",
    minPoints: 1500,
    maxPoints: 3999,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "Security Analyst",
    benefits: ["Beta feature access", "Direct mentor contact", "Certification discounts"],
    weeklyRequirement: 100,
  },
  B: {
    tier: "B",
    minPoints: 4000,
    maxPoints: 7999,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    description: "Senior Security Expert",
    benefits: ["VIP support", "Conference invitations", "Research collaboration"],
    weeklyRequirement: 150,
  },
  A: {
    tier: "A",
    minPoints: 8000,
    maxPoints: 14999,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    description: "Elite Bug Hunter",
    benefits: ["Exclusive events", "Industry partnerships", "Speaking opportunities"],
    weeklyRequirement: 200,
  },
  S: {
    tier: "S",
    minPoints: 15000,
    maxPoints: Number.POSITIVE_INFINITY,
    color: "text-red-600",
    bgColor: "bg-red-100",
    description: "Legendary Security Master",
    benefits: ["Hall of Fame", "Advisory board invitation", "Unlimited access"],
    weeklyRequirement: 250,
  },
}

export interface RankingMetrics {
  totalScore: number
  pointsWeight: number
  activityWeight: number
  consistencyWeight: number
  qualityWeight: number
}

export interface RewardItem {
  id: string
  name: string
  description: string
  pointsCost: number
  category: "badge" | "perk" | "physical" | "access"
  icon: string
  available: boolean
  limitedQuantity?: number
  requiredRank?: RankTier
}

export interface UserReward {
  id: string
  userId: string
  rewardId: string
  redeemedAt: string
  status: "pending" | "delivered" | "expired"
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: "milestone" | "streak" | "quality" | "community"
  requirement: {
    type: "points" | "bugs" | "streak" | "rank" | "special"
    value: number | string
  }
  pointsReward: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  unlockedAt: string
  progress?: number
}

export const calculateAdvancedRanking = (user: UserRanking, allUsers: UserRanking[]): RankingMetrics => {
  const now = new Date()
  const lastActivity = new Date(user.lastActivity)
  const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

  // Points weight (40% of total score)
  const pointsWeight = user.totalPoints * 0.4

  // Activity weight (25% of total score) - recent activity bonus
  const activityBonus = Math.max(0, 100 - daysSinceActivity * 5) // Decreases by 5 per day
  const activityWeight = activityBonus * 0.25

  // Consistency weight (20% of total score) - streak bonus
  const streakMultiplier = getStreakMultiplier(user.streak)
  const consistencyWeight = user.streak * streakMultiplier * 10 * 0.2

  // Quality weight (15% of total score) - average points per bug
  const avgPointsPerBug = user.bugsFound > 0 ? user.totalPoints / user.bugsFound : 0
  const qualityWeight = avgPointsPerBug * 0.15

  const totalScore = pointsWeight + activityWeight + consistencyWeight + qualityWeight

  return {
    totalScore,
    pointsWeight,
    activityWeight,
    consistencyWeight,
    qualityWeight,
  }
}

export const getStreakMultiplier = (streak: number): number => {
  if (streak >= 30) return STREAK_MULTIPLIERS[30]
  if (streak >= 14) return STREAK_MULTIPLIERS[14]
  if (streak >= 7) return STREAK_MULTIPLIERS[7]
  if (streak >= 3) return STREAK_MULTIPLIERS[3]
  return STREAK_MULTIPLIERS[0]
}

export const REWARD_CATALOG: RewardItem[] = [
  {
    id: "premium_badge",
    name: "Premium Hunter Badge",
    description: "Exclusive badge displayed on your profile",
    pointsCost: 5000,
    category: "badge",
    icon: "trophy",
    available: true,
  },
  {
    id: "hall_of_fame",
    name: "Hall of Fame Entry",
    description: "Permanent recognition in our Hall of Fame",
    pointsCost: 10000,
    category: "perk",
    icon: "star",
    available: true,
    requiredRank: "A",
  },
  {
    id: "elite_status",
    name: "Elite Hunter Status",
    description: "Special status with exclusive perks and access",
    pointsCost: 15000,
    category: "access",
    icon: "crown",
    available: true,
    requiredRank: "S",
  },
  {
    id: "security_hoodie",
    name: "Limited Edition Security Hoodie",
    description: "Premium hoodie with cybersecurity design",
    pointsCost: 8000,
    category: "physical",
    icon: "shirt",
    available: true,
    limitedQuantity: 100,
  },
  {
    id: "conference_ticket",
    name: "Security Conference Ticket",
    description: "Free ticket to major cybersecurity conference",
    pointsCost: 12000,
    category: "access",
    icon: "ticket",
    available: true,
    limitedQuantity: 20,
    requiredRank: "B",
  },
  {
    id: "mentorship_session",
    name: "1-on-1 Mentorship Session",
    description: "Personal mentorship with industry expert",
    pointsCost: 6000,
    category: "access",
    icon: "user-check",
    available: true,
    limitedQuantity: 50,
  },
]

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_bug",
    name: "First Discovery",
    description: "Submit your first vulnerability report",
    icon: "bug",
    category: "milestone",
    requirement: { type: "bugs", value: 1 },
    pointsReward: 100,
    rarity: "common",
  },
  {
    id: "critical_finder",
    name: "Critical Hunter",
    description: "Find your first critical vulnerability",
    icon: "alert-triangle",
    category: "quality",
    requirement: { type: "special", value: "critical_bug" },
    pointsReward: 500,
    rarity: "rare",
  },
  {
    id: "streak_master",
    name: "Consistency Master",
    description: "Maintain a 30-day activity streak",
    icon: "flame",
    category: "streak",
    requirement: { type: "streak", value: 30 },
    pointsReward: 1000,
    rarity: "epic",
  },
  {
    id: "point_collector",
    name: "Point Collector",
    description: "Accumulate 10,000 total points",
    icon: "coins",
    category: "milestone",
    requirement: { type: "points", value: 10000 },
    pointsReward: 500,
    rarity: "rare",
  },
  {
    id: "elite_hunter",
    name: "Elite Hunter",
    description: "Reach S-rank status",
    icon: "crown",
    category: "milestone",
    requirement: { type: "rank", value: "S" },
    pointsReward: 2000,
    rarity: "legendary",
  },
  {
    id: "bug_marathon",
    name: "Bug Marathon",
    description: "Submit 50 vulnerability reports",
    icon: "target",
    category: "milestone",
    requirement: { type: "bugs", value: 50 },
    pointsReward: 1500,
    rarity: "epic",
  },
]
