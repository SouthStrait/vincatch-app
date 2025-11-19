import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 1. Configuration object uses the ACTUAL STRING VALUES from your screenshot.
// This bypasses Vercel's environment variables for testing.
const firebaseConfig = {
  // CRITICAL: This is the exact key from your screenshot, used as a string literal:
  apiKey: "AIzaSyCTt8FpBcSgzywwlzoQMVEj9c_iCP-uJTk", 
  
  authDomain: "vincatch-2aefa.firebaseapp.com",
  projectId: "vincatch-2aefa",
  storageBucket: "vincatch-2aefa.firebasestorage.app",
  messagingSenderId: "648548741644",
  appId: "1:648548741644:web:26d0de643d5f198ed13429",
};

// 2. Initializes the app only once
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// 3. Initialize and export the services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;