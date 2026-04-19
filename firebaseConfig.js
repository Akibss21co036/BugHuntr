// Import Firebase SDKs
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getFirestore, initializeFirestore } from "firebase/firestore";
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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics (only on client-side)
let analytics;
if (typeof window !== "undefined") {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Initialize Firestore with long polling in browser environments where WebChannel is blocked.
const db =
  typeof window !== "undefined"
    ? initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: false,
      })
    : getFirestore(app);
const storage = getStorage(app); // 👈 Add this
const auth = getAuth(app); // 👈 Add this

// Export Firebase instances
export { app, analytics, db, storage, auth };
