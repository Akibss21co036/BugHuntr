"use client"

import { useState, useEffect } from "react"
import { type BugHunt, type BugHuntSubmission, BUG_HUNT_TEMPLATES } from "@/types/bug-hunt"
import { db } from "@/firebaseConfig"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

export function useBugHunt() {
  const [bugHunts, setBugHunts] = useState<BugHunt[]>([])
  const [submissions, setSubmissions] = useState<BugHuntSubmission[]>([])

  useEffect(() => {
    // Fetch bug hunts from Firestore
    const fetchBugHunts = async () => {
      const huntsSnapshot = await getDocs(collection(db, "bugHunts"))
      const hunts: BugHunt[] = huntsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BugHunt))
      setBugHunts(hunts)
    }
    // Fetch submissions from Firestore
    const fetchSubmissions = async () => {
      const submissionsSnapshot = await getDocs(collection(db, "bugHuntSubmissions"))
      const subs: BugHuntSubmission[] = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BugHuntSubmission))
      setSubmissions(subs)
    }
    fetchBugHunts()
    fetchSubmissions()
  }, [])

  const createBugHunt = async (
    huntData: Omit<BugHunt, "id" | "createdAt" | "updatedAt" | "currentParticipants" | "submissions">
  ) => {
    const newHunt = {
      ...huntData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentParticipants: 0,
      submissions: [],
    }
    const docRef = await addDoc(collection(db, "bugHunts"), newHunt)
    setBugHunts(prev => [...prev, { ...newHunt, id: docRef.id } as BugHunt])
    return { ...newHunt, id: docRef.id } as BugHunt
  }

  const removeBugHunt = async (huntId: string) => {
    try {
      await deleteDoc(doc(db, "bugHunts", huntId))
      setBugHunts(prev => prev.filter(hunt => hunt.id !== huntId))
      // Remove all submissions related to this hunt
      const q = query(collection(db, "bugHuntSubmissions"), where("huntId", "==", huntId))
      const subsSnapshot = await getDocs(q)
      subsSnapshot.forEach(subDoc => deleteDoc(doc(db, "bugHuntSubmissions", subDoc.id)))
      setSubmissions(prev => prev.filter(sub => sub.huntId !== huntId))
    } catch (error) {
      console.error("Error removing bug hunt:", error)
      throw error
    }
  }

  const updateBugHunt = async (huntId: string, updates: Partial<BugHunt>) => {
    await updateDoc(doc(db, "bugHunts", huntId), { ...updates, updatedAt: new Date().toISOString() })
    setBugHunts(prev => prev.map(hunt => hunt.id === huntId ? { ...hunt, ...updates, updatedAt: new Date().toISOString() } : hunt))
  }

  const submitToBugHunt = async (submission: Omit<BugHuntSubmission, "id" | "submittedAt" | "status">) => {
    const newSubmission = {
      ...submission,
      submittedAt: new Date().toISOString(),
      status: "pending" as "pending",
    }
    const docRef = await addDoc(collection(db, "bugHuntSubmissions"), newSubmission)
    const submissionWithId: BugHuntSubmission = { ...newSubmission, id: docRef.id }
    setSubmissions(prev => [...prev, submissionWithId])
    // Update hunt's current participants count
    const hunt = bugHunts.find((h) => h.id === submission.huntId)
    if (hunt) {
      const userAlreadyParticipating = submissions.some(
        (s) => s.huntId === submission.huntId && s.userId === submission.userId,
      )
      if (!userAlreadyParticipating) {
        await updateBugHunt(submission.huntId, {
          currentParticipants: hunt.currentParticipants + 1,
        })
      }
    }
    return { ...newSubmission, id: docRef.id } as BugHuntSubmission
  }

  const reviewSubmission = async (
    submissionId: string,
    status: "approved" | "rejected" | "duplicate",
    reviewNotes: string,
    pointsAwarded?: number,
    reviewedBy?: string,
  ) => {
    await updateDoc(doc(db, "bugHuntSubmissions", submissionId), {
      status,
      reviewNotes,
      pointsAwarded,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    })
    setSubmissions(prev => prev.map(submission =>
      submission.id === submissionId
        ? {
            ...submission,
            status,
            reviewNotes,
            pointsAwarded,
            reviewedBy,
            reviewedAt: new Date().toISOString(),
          }
        : submission
    ))
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
