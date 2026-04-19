// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 👈 Added for file uploads
import { getAuth } from "firebase/auth"; // 👈 Added for authentication

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfPDOcogDb7kls-1SeyFMsB0VRkihkD20",
  authDomain: "bughuntr-3f895.firebaseapp.com",
  projectId: "bughuntr-3f895",
  storageBucket: "bughuntr-3f895.appspot.com",
  messagingSenderId: "880398940533",
  appId: "1:880398940533:web:835cd3f7c8e4083d8d3b3c",
  measurementId: "G-G9K6NC2J3K",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only on client-side)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Initialize Firestore, Storage, and Auth
const db = getFirestore(app);
const storage = getStorage(app); // 👈 Add this
const auth = getAuth(app); // 👈 Add this

// Export Firebase instances
export { app, analytics, db, storage, auth };
