// services/firebase.js (or wherever you placed it)

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 1. Define the configuration object using Vercel's Environment Variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 2. Initialize Firebase (The Optimization)
// This uses getApps() to check if the app has already been initialized.
// This is cleaner and more robust for preventing the "Firebase: App named '[DEFAULT]' already exists" error.
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// 3. Initialize Cloud Firestore and export it
export const db = getFirestore(app);

// 4. Optionally export the main app object
export default app;