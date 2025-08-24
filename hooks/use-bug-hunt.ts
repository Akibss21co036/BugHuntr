"use client"

import { useState, useEffect } from "react"
import { type BugHunt, type BugHuntSubmission, BUG_HUNT_TEMPLATES } from "@/types/bug-hunt"

export function useBugHunt() {
  const [bugHunts, setBugHunts] = useState<BugHunt[]>([])
  const [submissions, setSubmissions] = useState<BugHuntSubmission[]>([])

  useEffect(() => {
    // Load from localStorage or initialize with mock data
    const savedHunts = localStorage.getItem("bugHunts")
    const savedSubmissions = localStorage.getItem("bugHuntSubmissions")

    if (savedHunts) {
      setBugHunts(JSON.parse(savedHunts))
    } else {
      // Initialize with sample bug hunt
      const sampleHunt: BugHunt = {
        id: "hunt_001",
        title: "TechCorp Web Application Security Assessment",
        description:
          "Comprehensive security testing of our main web application and API endpoints. Focus on authentication, authorization, and data validation vulnerabilities.",
        company: "TechCorp",
        scope: ["*.techcorp.com", "app.techcorp.com", "api.techcorp.com"],
        categories: ["Web Application", "API Security", "Authentication"],
        difficulty: "intermediate",
        status: "active",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        maxParticipants: 50,
        currentParticipants: 12,
        createdBy: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rewards: {
          critical: 2000,
          high: 1000,
          medium: 500,
          low: 200,
        },
        rules: [
          "No automated scanning without explicit permission",
          "Report findings immediately upon discovery",
          "Do not access or modify user data",
          "Respect rate limits and avoid DoS attacks",
          "Test only within the defined scope",
        ],
        assets: [
          "Main web application (app.techcorp.com)",
          "REST API (api.techcorp.com)",
          "Mobile API endpoints",
          "User authentication system",
        ],
        submissions: [],
      }
      setBugHunts([sampleHunt])
      localStorage.setItem("bugHunts", JSON.stringify([sampleHunt]))
    }

    if (savedSubmissions) {
      setSubmissions(JSON.parse(savedSubmissions))
    }
  }, [])

  const createBugHunt = (
    huntData: Omit<BugHunt, "id" | "createdAt" | "updatedAt" | "currentParticipants" | "submissions">,
  ) => {
    const newHunt: BugHunt = {
      ...huntData,
      id: `hunt_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentParticipants: 0,
      submissions: [],
    }

    const updatedHunts = [...bugHunts, newHunt]
    setBugHunts(updatedHunts)
    localStorage.setItem("bugHunts", JSON.stringify(updatedHunts))

    return newHunt
  }

  const removeBugHunt = async (huntId: string) => {
    console.log("[v0] Removing bug hunt:", huntId)

    try {
      // Remove the hunt
      const updatedHunts = bugHunts.filter((hunt) => hunt.id !== huntId)
      setBugHunts(updatedHunts)
      localStorage.setItem("bugHunts", JSON.stringify(updatedHunts))

      // Remove all submissions related to this hunt
      const updatedSubmissions = submissions.filter((submission) => submission.huntId !== huntId)
      setSubmissions(updatedSubmissions)
      localStorage.setItem("bugHuntSubmissions", JSON.stringify(updatedSubmissions))

      // Notify user hunt hook to clean up user participation
      const event = new CustomEvent("huntRemoved", { detail: { huntId } })
      window.dispatchEvent(event)

      console.log("[v0] Bug hunt removed successfully:", huntId)
    } catch (error) {
      console.error("[v0] Error removing bug hunt:", error)
      throw error
    }
  }

  const updateBugHunt = (huntId: string, updates: Partial<BugHunt>) => {
    const updatedHunts = bugHunts.map((hunt) =>
      hunt.id === huntId ? { ...hunt, ...updates, updatedAt: new Date().toISOString() } : hunt,
    )
    setBugHunts(updatedHunts)
    localStorage.setItem("bugHunts", JSON.stringify(updatedHunts))
  }

  const submitToBugHunt = (submission: Omit<BugHuntSubmission, "id" | "submittedAt" | "status">) => {
    const newSubmission: BugHuntSubmission = {
      ...submission,
      id: `submission_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: "pending",
    }

    const updatedSubmissions = [...submissions, newSubmission]
    setSubmissions(updatedSubmissions)
    localStorage.setItem("bugHuntSubmissions", JSON.stringify(updatedSubmissions))

    // Update hunt's current participants count
    const hunt = bugHunts.find((h) => h.id === submission.huntId)
    if (hunt) {
      const userAlreadyParticipating = submissions.some(
        (s) => s.huntId === submission.huntId && s.userId === submission.userId,
      )

      if (!userAlreadyParticipating) {
        updateBugHunt(submission.huntId, {
          currentParticipants: hunt.currentParticipants + 1,
        })
      }
    }

    return newSubmission
  }

  const reviewSubmission = (
    submissionId: string,
    status: "approved" | "rejected" | "duplicate",
    reviewNotes: string,
    pointsAwarded?: number,
    reviewedBy?: string,
  ) => {
    const updatedSubmissions = submissions.map((submission) =>
      submission.id === submissionId
        ? {
            ...submission,
            status,
            reviewNotes,
            pointsAwarded,
            reviewedBy,
            reviewedAt: new Date().toISOString(),
          }
        : submission,
    )
    setSubmissions(updatedSubmissions)
    localStorage.setItem("bugHuntSubmissions", JSON.stringify(updatedSubmissions))
  }

  const getActiveBugHunts = () => {
    return bugHunts.filter((hunt) => hunt.status === "active")
  }

  const getBugHuntById = (huntId: string) => {
    return bugHunts.find((hunt) => hunt.id === huntId)
  }

  const getSubmissionsByHunt = (huntId: string) => {
    return submissions.filter((submission) => submission.huntId === huntId)
  }

  const getSubmissionsByUser = (userId: string) => {
    return submissions.filter((submission) => submission.userId === userId)
  }

  const getUserBugHunts = (userId: string) => {
    return bugHunts.filter((hunt) => hunt.createdBy === userId)
  }

  return {
    bugHunts,
    submissions,
    createBugHunt,
    updateBugHunt,
    removeBugHunt, // Added removeBugHunt to exports
    submitToBugHunt,
    reviewSubmission,
    getActiveBugHunts,
    getBugHuntById,
    getSubmissionsByHunt,
    getSubmissionsByUser,
    getUserBugHunts,
    BUG_HUNT_TEMPLATES,
  }
}
