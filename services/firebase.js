import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 1. Configuration object uses the ACTUAL STRING VALUES (Hardcoded to bypass Vercel ENV issue)
// This is the *exact* configuration from your Firebase Console screenshot.
const firebaseConfig = {
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