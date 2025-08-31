"use client"

import { useState, useEffect } from "react"
import {
  type UserRanking,
  type RankTier,
  type PointsTransaction,
  type RewardItem,
  type UserReward,
  type UserAchievement,
  SEVERITY_POINTS,
  RANK_CONFIGS,
  REWARD_CATALOG,
  ACHIEVEMENTS,
  calculateAdvancedRanking,
  getStreakMultiplier,
} from "@/types/ranking"
import { mockBugs } from "@/data/mock-bugs"

export function useRanking() {
  const [userRankings, setUserRankings] = useState<UserRanking[]>([])
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransaction[]>([])
  const [userRewards, setUserRewards] = useState<UserReward[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])

  useEffect(() => {
    // Initialize ranking data from localStorage or create mock data
    const savedRankings = localStorage.getItem("userRankings")
    const savedTransactions = localStorage.getItem("pointsTransactions")
    const savedRewards = localStorage.getItem("userRewards")
    const savedAchievements = localStorage.getItem("userAchievements")

    if (savedRankings) {
      setUserRankings(JSON.parse(savedRankings))
    } else {
      // Create initial rankings based on mock bugs
      const initialRankings = generateInitialRankings()
      setUserRankings(initialRankings)
      localStorage.setItem("userRankings", JSON.stringify(initialRankings))
    }

    if (savedTransactions) {
      setPointsTransactions(JSON.parse(savedTransactions))
    }

    if (savedRewards) {
      setUserRewards(JSON.parse(savedRewards))
    }

    if (savedAchievements) {
      setUserAchievements(JSON.parse(savedAchievements))
    }
  }, [])

  const generateInitialRankings = (): UserRanking[] => {
    const userStats = new Map<
      string,
      {
        points: number
        bugs: number
        earnings: number
        lastBugDate: string
      }
    >()

    // Calculate stats from mock bugs
    mockBugs.forEach((bug) => {
      const points = SEVERITY_POINTS[bug.severity]
      const current = userStats.get(bug.author) || {
        points: 0,
        bugs: 0,
        earnings: 0,
        lastBugDate: bug.date,
      }
      userStats.set(bug.author, {
        points: current.points + points,
        bugs: current.bugs + 1,
        earnings: current.earnings + bug.bounty,
        lastBugDate: bug.date > current.lastBugDate ? bug.date : current.lastBugDate,
      })
    })

    return Array.from(userStats.entries())
      .map(([username, stats]) => {
        const weeklyPoints = Math.floor(stats.points * 0.3) // Mock weekly points
        const monthlyPoints = Math.floor(stats.points * 0.7) // Mock monthly points
        const streak = Math.floor(Math.random() * 15) + 1 // Mock streak

        const user: UserRanking = {
          userId: username,
          username,
          totalPoints: stats.points,
          rank: calculateRank(stats.points),
          bugsFound: stats.bugs,
          totalEarnings: stats.earnings,
          joinDate: "2024-01-01",
          weeklyPoints,
          monthlyPoints,
          streak,
          lastActivity: stats.lastBugDate,
          rankProgress: 0,
          nextRankPoints: 0,
        }

        // Calculate rank progress
        const { rankProgress, nextRankPoints } = calculateRankProgress(user.totalPoints, user.rank)
        user.rankProgress = rankProgress
        user.nextRankPoints = nextRankPoints

        return user
      })
      .sort((a, b) => {
        const metricsA = calculateAdvancedRanking(a, [])
        const metricsB = calculateAdvancedRanking(b, [])
        return metricsB.totalScore - metricsA.totalScore
      })
  }

  const calculateRank = (points: number): RankTier => {
    for (const [tier, config] of Object.entries(RANK_CONFIGS)) {
      if (points >= config.minPoints && points <= config.maxPoints) {
        return tier as RankTier
      }
    }
    return "E"
  }

  const calculateRankProgress = (points: number, currentRank: RankTier) => {
    const currentConfig = RANK_CONFIGS[currentRank]
    const pointsInCurrentRank = points - currentConfig.minPoints
    const pointsNeededForRank = currentConfig.maxPoints - currentConfig.minPoints

    if (currentRank === "S") {
      return { rankProgress: 100, nextRankPoints: 0 }
    }

    const rankProgress = Math.min(100, (pointsInCurrentRank / pointsNeededForRank) * 100)
    const nextRankPoints = currentConfig.maxPoints + 1 - points

    return { rankProgress, nextRankPoints }
  }

  const addPoints = (userId: string, bugId: number, severity: keyof typeof SEVERITY_POINTS, reason: string) => {
    const basePoints = SEVERITY_POINTS[severity]

    const user = userRankings.find((u) => u.userId === userId)
    const multiplier = user ? getStreakMultiplier(user.streak) : 1
    const points = Math.floor(basePoints * multiplier)

    const transaction: PointsTransaction = {
      id: Date.now().toString(),
      userId,
      bugId,
      points,
      reason,
      timestamp: new Date().toISOString(),
      severity,
      multiplier: multiplier > 1 ? multiplier : undefined,
    }

    // Update user ranking
    const updatedRankings = userRankings.map((user) => {
      if (user.userId === userId) {
        const newPoints = user.totalPoints + points
        const newRank = calculateRank(newPoints)
        const { rankProgress, nextRankPoints } = calculateRankProgress(newPoints, newRank)

        const now = new Date()
        const lastActivity = new Date(user.lastActivity)
        const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        const newStreak = daysSinceLastActivity <= 1 ? user.streak + 1 : 1

        return {
          ...user,
          totalPoints: newPoints,
          rank: newRank,
          bugsFound: user.bugsFound + 1,
          weeklyPoints: user.weeklyPoints + points,
          monthlyPoints: user.monthlyPoints + points,
          streak: newStreak,
          lastActivity: now.toISOString(),
          rankProgress,
          nextRankPoints,
        }
      }
      return user
    })

    // Add new user if not exists
    if (!userRankings.find((u) => u.userId === userId)) {
      const newUser: UserRanking = {
        userId,
        username: userId,
        totalPoints: points,
        rank: calculateRank(points),
        bugsFound: 1,
        totalEarnings: 0,
        joinDate: new Date().toISOString(),
        weeklyPoints: points,
        monthlyPoints: points,
        streak: 1,
        lastActivity: new Date().toISOString(),
        rankProgress: 0,
        nextRankPoints: 0,
      }

      const { rankProgress, nextRankPoints } = calculateRankProgress(points, newUser.rank)
      newUser.rankProgress = rankProgress
      newUser.nextRankPoints = nextRankPoints

      updatedRankings.push(newUser)
    }

    const newTransactions = [...pointsTransactions, transaction]

    const sortedRankings = updatedRankings.sort((a, b) => {
      const metricsA = calculateAdvancedRanking(a, updatedRankings)
      const metricsB = calculateAdvancedRanking(b, updatedRankings)
      return metricsB.totalScore - metricsA.totalScore
    })

    setUserRankings(sortedRankings)
    setPointsTransactions(newTransactions)

    checkAchievements(userId, sortedRankings.find((u) => u.userId === userId)!, severity)

    // Save to localStorage
    localStorage.setItem("userRankings", JSON.stringify(sortedRankings))
    localStorage.setItem("pointsTransactions", JSON.stringify(newTransactions))
  }

  const checkAchievements = (userId: string, user: UserRanking, severity?: keyof typeof SEVERITY_POINTS) => {
    const newAchievements: UserAchievement[] = []

    ACHIEVEMENTS.forEach((achievement) => {
      // Check if user already has this achievement
      const hasAchievement = userAchievements.some((ua) => ua.userId === userId && ua.achievementId === achievement.id)

      if (hasAchievement) return

      let unlocked = false

      switch (achievement.requirement.type) {
        case "points":
          unlocked = user.totalPoints >= (achievement.requirement.value as number)
          break
        case "bugs":
          unlocked = user.bugsFound >= (achievement.requirement.value as number)
          break
        case "streak":
          unlocked = user.streak >= (achievement.requirement.value as number)
          break
        case "rank":
          unlocked = user.rank === achievement.requirement.value
          break
        case "special":
          if (achievement.requirement.value === "critical_bug" && severity === "critical") {
            unlocked = true
          }
          break
      }

      if (unlocked) {
        newAchievements.push({
          id: Date.now().toString() + Math.random(),
          userId,
          achievementId: achievement.id,
          unlockedAt: new Date().toISOString(),
        })

        // Award bonus points for achievement
        const bonusTransaction: PointsTransaction = {
          id: Date.now().toString() + "bonus",
          userId,
          bugId: 0,
          points: achievement.pointsReward,
          reason: `Achievement unlocked: ${achievement.name}`,
          timestamp: new Date().toISOString(),
          severity: "medium",
        }

        setPointsTransactions((prev) => [...prev, bonusTransaction])
      }
    })

    if (newAchievements.length > 0) {
      const updatedAchievements = [...userAchievements, ...newAchievements]
      setUserAchievements(updatedAchievements)
      localStorage.setItem("userAchievements", JSON.stringify(updatedAchievements))
    }
  }

  const redeemReward = (userId: string, rewardId: string): { success: boolean; message: string } => {
    const user = userRankings.find((u) => u.userId === userId)
    const reward = REWARD_CATALOG.find((r) => r.id === rewardId)

    if (!user || !reward) {
      return { success: false, message: "User or reward not found" }
    }

    if (!reward.available) {
      return { success: false, message: "Reward is no longer available" }
    }

    if (user.totalPoints < reward.pointsCost) {
      return { success: false, message: "Insufficient points" }
    }

    if (reward.requiredRank && !isRankHigherOrEqual(user.rank, reward.requiredRank)) {
      return { success: false, message: `Requires ${reward.requiredRank} rank or higher` }
    }

    // Check if limited quantity reward is still available
    if (reward.limitedQuantity) {
      const redeemedCount = userRewards.filter((ur) => ur.rewardId === rewardId).length
      if (redeemedCount >= reward.limitedQuantity) {
        return { success: false, message: "Reward is out of stock" }
      }
    }

    // Deduct points from user
    const updatedRankings = userRankings.map((u) => {
      if (u.userId === userId) {
        return { ...u, totalPoints: u.totalPoints - reward.pointsCost }
      }
      return u
    })

    // Add reward to user's collection
    const newReward: UserReward = {
      id: Date.now().toString(),
      userId,
      rewardId,
      redeemedAt: new Date().toISOString(),
      status: "pending",
    }

    const updatedRewards = [...userRewards, newReward]

    setUserRankings(updatedRankings)
    setUserRewards(updatedRewards)

    localStorage.setItem("userRankings", JSON.stringify(updatedRankings))
    localStorage.setItem("userRewards", JSON.stringify(updatedRewards))

    return { success: true, message: "Reward redeemed successfully!" }
  }

  const isRankHigherOrEqual = (userRank: RankTier, requiredRank: RankTier): boolean => {
    const rankOrder: RankTier[] = ["E", "D", "C", "B", "A", "S"]
    return rankOrder.indexOf(userRank) >= rankOrder.indexOf(requiredRank)
  }

  const getUserRewards = (userId: string): UserReward[] => {
    return userRewards.filter((reward) => reward.userId === userId)
  }

  const getUserAchievements = (userId: string): UserAchievement[] => {
    return userAchievements.filter((achievement) => achievement.userId === userId)
  }

  const getAvailableRewards = (userId: string): RewardItem[] => {
    const user = userRankings.find((u) => u.userId === userId)
    if (!user) return []

    return REWARD_CATALOG.filter((reward) => {
      if (!reward.available) return false
      if (reward.requiredRank && !isRankHigherOrEqual(user.rank, reward.requiredRank)) return false
      if (reward.limitedQuantity) {
        const redeemedCount = userRewards.filter((ur) => ur.rewardId === reward.id).length
        if (redeemedCount >= reward.limitedQuantity) return false
      }
      return true
    })
  }

  const getUserRanking = (userId: string): UserRanking | undefined => {
    return userRankings.find((user) => user.userId === userId)
  }

  const getLeaderboard = (limit?: number): UserRanking[] => {
    return limit ? userRankings.slice(0, limit) : userRankings
  }

  const getRankBenefits = (rank: RankTier) => {
    return RANK_CONFIGS[rank].benefits
  }

  const getWeeklyRequirement = (rank: RankTier) => {
    return RANK_CONFIGS[rank].weeklyRequirement || 0
  }

  const isRankAtRisk = (user: UserRanking): boolean => {
    const requirement = getWeeklyRequirement(user.rank)
    return requirement > 0 && user.weeklyPoints < requirement
  }

  return {
    userRankings,
    pointsTransactions,
    userRewards,
    userAchievements,
    addPoints,
    getUserRanking,
    getLeaderboard,
    calculateRank,
    getRankBenefits,
    getWeeklyRequirement,
    isRankAtRisk,
    calculateAdvancedRanking,
    redeemReward,
    getUserRewards,
    getUserAchievements,
    getAvailableRewards,
    RANK_CONFIGS,
    REWARD_CATALOG,
    ACHIEVEMENTS,
  }
}
