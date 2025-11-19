import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 1. Define the configuration object using Vercel environment variables
const firebaseConfig = {
  // CRITICAL: Must use the exact names set on Vercel
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 2. Initializes the app only once
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// 3. Initialize and export the services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;