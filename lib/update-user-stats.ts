import { db } from "@/firebaseConfig"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"

export async function updateUserBugCount(username: string, increment: number = 1) {
  try {
    // Find the user profile by username
    const q = query(collection(db, "userProfiles"), where("username", "==", username))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return false
    
    const userDoc = snapshot.docs[0]
    const currentBugCount = userDoc.data().bugsSubmitted || 0
    
    await updateDoc(doc(db, "userProfiles", userDoc.id), {
      bugsSubmitted: currentBugCount + increment,
      lastActivity: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    
    return true
  } catch (error) {
    console.error("Error updating bug count:", error)
    return false
  }
}

export async function updateUserStats(username: string, points: number, bugIncrement: number = 1) {
  try {
    console.log(`Updating stats for user: ${username}, points: ${points}`)
    
    // Find the user profile by username
    const q = query(collection(db, "userProfiles"), where("username", "==", username))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.error(`No user profile found for username: ${username}`)
      // Let's create the profile if it doesn't exist
      const { addDoc } = await import("firebase/firestore")
      await addDoc(collection(db, "userProfiles"), {
        username: username,
        points: points,
        bugsSubmitted: bugIncrement,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      console.log(`Created new profile for ${username}`)
      return true
    }
    
    const userDoc = snapshot.docs[0]
    const currentData = userDoc.data()
    const currentPoints = currentData.points || 0
    const currentBugCount = currentData.bugsSubmitted || 0
    
    console.log(`Current points: ${currentPoints}, adding: ${points}, new total: ${currentPoints + points}`)
    
    await updateDoc(doc(db, "userProfiles", userDoc.id), {
      points: currentPoints + points,
      bugsSubmitted: currentBugCount + bugIncrement,
      lastActivity: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    
    console.log(`Successfully updated stats for ${username}`)
    return true
  } catch (error) {
    console.error("Error updating user stats:", error)
    return false
  }
}