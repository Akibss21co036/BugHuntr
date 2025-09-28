import { db } from "@/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function getUserProfileByUsername(username: string) {
  const q = query(collection(db, "userProfiles"), where("username", "==", username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}
