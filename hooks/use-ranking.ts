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

import { db } from "../firebaseConfig"
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore"

export function useRanking() {
  const [userRankings, setUserRankings] = useState<UserRanking[]>([])
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransaction[]>([])
  const [userRewards, setUserRewards] = useState<UserReward[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])

  // 📡 Load live data from Firestore
  useEffect(() => {
  const unsubUsers = onSnapshot(
  query(collection(db, "userProfiles"), orderBy("points", "desc")),
  (snapshot) => {
    setUserRankings(
      snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          ...(data as Omit<UserRanking, "userId">),
          userId: doc.id,
          totalPoints: data.totalPoints ?? data.points ?? 0, // fallback
        }
      })
    )
  }
)



    const unsubTransactions = onSnapshot(
      collection(db, "pointsTransactions"),
      (snapshot) => {
        setPointsTransactions(snapshot.docs.map((doc) => doc.data() as PointsTransaction))
      }
    )

    const unsubRewards = onSnapshot(collection(db, "userRewards"), (snapshot) => {
      setUserRewards(snapshot.docs.map((doc) => doc.data() as UserReward))
    })

    const unsubAchievements = onSnapshot(collection(db, "userAchievements"), (snapshot) => {
      setUserAchievements(snapshot.docs.map((doc) => doc.data() as UserAchievement))
    })

    return () => {
      unsubUsers()
      unsubTransactions()
      unsubRewards()
      unsubAchievements()
    }
  }, [])

  // 🏆 Rank utilities
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

  // ➕ Add points & update Firestore
  const addPoints = async (
    userId: string,
    bugId: number,
    severity: keyof typeof SEVERITY_POINTS,
    reason: string
  ) => {
    const basePoints = SEVERITY_POINTS[severity]
    const user = userRankings.find((u) => u.userId === userId)
    const multiplier = user ? getStreakMultiplier(user.streak) : 1
    const points = Math.floor(basePoints * multiplier)

    // transaction log
    const transaction: PointsTransaction = {
      id: Date.now().toString(),
      userId,
      bugId,
      points,
      reason,
      timestamp: new Date().toISOString(),
      severity,
      ...(multiplier > 1 && { multiplier }),
    }
    await setDoc(doc(db, "pointsTransactions", transaction.id), transaction)

    // update user profile
    if (user) {
      const newPoints = user.totalPoints + points
      const newRank = calculateRank(newPoints)
      const { rankProgress, nextRankPoints } = calculateRankProgress(newPoints, newRank)

      const now = new Date()
      const lastActivity = new Date(user.lastActivity)
      const daysSinceLast = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      const newStreak = daysSinceLast <= 1 ? user.streak + 1 : 1

      await updateDoc(doc(db, "userProfiles", userId), {
        totalPoints: newPoints,
        rank: newRank,
        bugsFound: user.bugsFound + 1,
        weeklyPoints: user.weeklyPoints + points,
        monthlyPoints: user.monthlyPoints + points,
        streak: newStreak,
        lastActivity: now.toISOString(),
        rankProgress,
        nextRankPoints,
      })
    } else {
      // if user doesn't exist, create them
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

      await setDoc(doc(db, "userProfiles", userId), newUser)
    }

    checkAchievements(userId, severity)
  }

  // 🏅 Check achievements
  const checkAchievements = async (
    userId: string,
    severity?: keyof typeof SEVERITY_POINTS
  ) => {
    const user = userRankings.find((u) => u.userId === userId)
    if (!user) return

    for (const achievement of ACHIEVEMENTS) {
      const hasAchievement = userAchievements.some(
        (ua) => ua.userId === userId && ua.achievementId === achievement.id
      )
      if (hasAchievement) continue

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
        const newAchievement: UserAchievement = {
          id: Date.now().toString(),
          userId,
          achievementId: achievement.id,
          unlockedAt: new Date().toISOString(),
        }
        await setDoc(doc(db, "userAchievements", newAchievement.id), newAchievement)

        // bonus points
        const bonusTransaction: PointsTransaction = {
          id: Date.now().toString() + "bonus",
          userId,
          bugId: 0,
          points: achievement.pointsReward,
          reason: `Achievement unlocked: ${achievement.name}`,
          timestamp: new Date().toISOString(),
          severity: "medium",
        }
        await setDoc(doc(db, "pointsTransactions", bonusTransaction.id), bonusTransaction)

        await updateDoc(doc(db, "userProfiles", userId), {
          totalPoints: user.totalPoints + achievement.pointsReward,
        })
      }
    }
  }

  // 🎁 Redeem rewards
  const redeemReward = async (
    userId: string,
    rewardId: string
  ): Promise<{ success: boolean; message: string }> => {
    const user = userRankings.find((u) => u.userId === userId)
    const reward = REWARD_CATALOG.find((r) => r.id === rewardId)

    if (!user || !reward) return { success: false, message: "User or reward not found" }
    if (!reward.available) return { success: false, message: "Reward not available" }
    if (user.totalPoints < reward.pointsCost) return { success: false, message: "Insufficient points" }
    if (reward.requiredRank && !isRankHigherOrEqual(user.rank, reward.requiredRank)) {
      return { success: false, message: `Requires ${reward.requiredRank} or higher` }
    }

    if (reward.limitedQuantity) {
      const redeemedCount = userRewards.filter((ur) => ur.rewardId === rewardId).length
      if (redeemedCount >= reward.limitedQuantity) {
        return { success: false, message: "Out of stock" }
      }
    }

    await updateDoc(doc(db, "userProfiles", userId), {
      totalPoints: user.totalPoints - reward.pointsCost,
    })

    const newReward: UserReward = {
      id: Date.now().toString(),
      userId,
      rewardId,
      redeemedAt: new Date().toISOString(),
      status: "pending",
    }
    await setDoc(doc(db, "userRewards", newReward.id), newReward)

    return { success: true, message: "Reward redeemed!" }
  }

  // helpers
  const isRankHigherOrEqual = (userRank: RankTier, requiredRank: RankTier): boolean => {
    const order: RankTier[] = ["E", "D", "C", "B", "A", "S"]
    return order.indexOf(userRank) >= order.indexOf(requiredRank)
  }

  const getUserRewards = (userId: string) => userRewards.filter((r) => r.userId === userId)
  const getUserAchievements = (userId: string) => userAchievements.filter((a) => a.userId === userId)
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

  const getUserRanking = (userId: string) => userRankings.find((u) => u.userId === userId)
  const getLeaderboard = (limit?: number) =>
    limit ? userRankings.slice(0, limit) : userRankings
  const getRankBenefits = (rank: RankTier) => RANK_CONFIGS[rank].benefits
  const getWeeklyRequirement = (rank: RankTier) => RANK_CONFIGS[rank].weeklyRequirement || 0
  const isRankAtRisk = (user: UserRanking) => {
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
