"use client"

import { db } from "@/firebaseConfig"
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"
import { getDisplayUsername } from "@/lib/extract-username"

/**
 * Updates existing user profiles to have proper usernames extracted from emails
 * This should be run once to migrate existing users
 */
export async function migrateUserProfilesWithUsernames() {
  try {
    console.log("Starting user profile migration...")
    
    // Get all user profiles
    const usersSnapshot = await getDocs(collection(db, "userProfiles"))
    let updatedCount = 0
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      const currentUsername = userData.username
      const email = userData.email
      
      // If user doesn't have a username or has email as username, extract from email
      if (!currentUsername || currentUsername.includes("@")) {
        const newUsername = getDisplayUsername(currentUsername, email || currentUsername)
        
        if (newUsername && newUsername !== currentUsername) {
          await updateDoc(doc(db, "userProfiles", userDoc.id), {
            username: newUsername,
            updatedAt: new Date().toISOString()
          })
          
          console.log(`Updated user ${userDoc.id}: ${currentUsername} -> ${newUsername}`)
          updatedCount++
        }
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} user profiles.`)
    return { success: true, updatedCount }
    
  } catch (error) {
    console.error("Error migrating user profiles:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates a specific user to admin role
 */
export async function updateUserRole(username: string, role: "user" | "admin") {
  try {
    // Find user by username
    const usersSnapshot = await getDocs(collection(db, "userProfiles"))
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      if (userData.username === username) {
        await updateDoc(doc(db, "userProfiles", userDoc.id), {
          role: role,
          updatedAt: new Date().toISOString()
        })
        
        console.log(`Updated ${username} role to ${role}`)
        return { success: true }
      }
    }
    
    console.log(`User ${username} not found`)
    return { success: false, error: "User not found" }
    
  } catch (error) {
    console.error("Error updating user role:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}