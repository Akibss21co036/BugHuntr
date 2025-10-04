import { db } from "@/firebaseConfig"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"

// List of admin usernames - in production, this would come from a secure config
const ADMIN_USERNAMES = ["admin", "khanakib", "google_admin", "system_admin"]

export async function markAdminUsers() {
  try {
    for (const adminUsername of ADMIN_USERNAMES) {
      const q = query(collection(db, "userProfiles"), where("username", "==", adminUsername))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0]
        await updateDoc(doc(db, "userProfiles", userDoc.id), {
          role: "admin",
          updatedAt: new Date().toISOString()
        })
        console.log(`Updated ${adminUsername} to admin role`)
      } else {
        console.log(`User ${adminUsername} not found in profiles`)
      }
    }
    console.log("Admin role update completed")
  } catch (error) {
    console.error("Error updating admin roles:", error)
  }
}

// Function to manually set a user as admin (call from browser console if needed)
export async function setUserAsAdmin(username: string) {
  try {
    const q = query(collection(db, "userProfiles"), where("username", "==", username))
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0]
      await updateDoc(doc(db, "userProfiles", userDoc.id), {
        role: "admin",
        updatedAt: new Date().toISOString()
      })
      console.log(`Successfully updated ${username} to admin role`)
      return true
    } else {
      console.log(`User ${username} not found in profiles`)
      return false
    }
  } catch (error) {
    console.error("Error setting user as admin:", error)
    return false
  }
}