import { db } from "@/firebaseConfig"
import { collection, addDoc } from "firebase/firestore"

export async function createUserProfile(username: string) {
  // Points start at 0 for new users
  return addDoc(collection(db, "userProfiles"), {
    username,
    points: 0,
    createdAt: new Date().toISOString(),
  })
}
