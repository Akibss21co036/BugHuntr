import { db } from "@/firebaseConfig"
import { collection, getDocs, query, where, updateDoc, doc, addDoc } from "firebase/firestore"
import { getDisplayUsername } from "./extract-username"

export async function migrateUsernamesFromEmails() {
  try {
    const userProfilesQuery = query(collection(db, "userProfiles"))
    const snapshot = await getDocs(userProfilesQuery)
    
    let updated = 0
    let created = 0
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data()
      
      // If username looks like an email, extract the username part
      if (data.username && data.username.includes("@")) {
        const newUsername = getDisplayUsername(data.username)
        
        if (newUsername !== data.username) {
          await updateDoc(doc(db, "userProfiles", docSnapshot.id), {
            username: newUsername,
            originalEmail: data.username, // Keep original for reference
            updatedAt: new Date().toISOString()
          })
          updated++
          console.log(`Updated username from ${data.username} to ${newUsername}`)
        }
      }
    }
    
    return { updated, created }
  } catch (error) {
    console.error("Migration error:", error)
    throw error
  }
}

export async function updateUserRole(username: string, role: "user" | "admin", companyName?: string) {
  try {
    const userQuery = query(collection(db, "userProfiles"), where("username", "==", username))
    const snapshot = await getDocs(userQuery)
    
    if (snapshot.empty) {
      // Create new profile if user doesn't exist
      await addDoc(collection(db, "userProfiles"), {
        username,
        role,
        companyName,
        points: 0,
        bugsSubmitted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      console.log(`Created new profile for ${username} with role ${role}`)
    } else {
      // Update existing profile
      const userDoc = snapshot.docs[0]
      await updateDoc(doc(db, "userProfiles", userDoc.id), {
        role,
        companyName,
        updatedAt: new Date().toISOString()
      })
      console.log(`Updated role for ${username} to ${role}`)
    }
  } catch (error) {
    console.error(`Error updating role for ${username}:`, error)
    throw error
  }
}