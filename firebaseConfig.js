// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfPDOcogDb7kls-1SeyFMsB0VRkihkD20",
  authDomain: "bughuntr-3f895.firebaseapp.com",
  projectId: "bughuntr-3f895",
  storageBucket: "bughuntr-3f895.appspot.com",
  messagingSenderId: "880398940533",
  appId: "1:880398940533:web:835cd3f7c8e4083d8d3b3c",
  measurementId: "G-G9K6NC2J3K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getFirestore(app);

export { app, analytics, db };
