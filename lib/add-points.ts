import { db } from "@/firebaseConfig"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"

export async function addPointsToUserProfile(username: string, points: number) {
  // Find the user profile by username
  const q = query(collection(db, "userProfiles"), where("username", "==", username))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return false
  const userDoc = snapshot.docs[0]
  const currentPoints = userDoc.data().points || 0
  await updateDoc(doc(db, "userProfiles", userDoc.id), {
    points: currentPoints + points,
    updatedAt: new Date().toISOString(),
  })
  return true
}
