import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 1. Configuration relies on parsing a single JSON string from the environment.
// This solves the persistent issue of client-side bundlers failing to read 
// multiple separate NEXT_PUBLIC_ variables correctly.
const configString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
let firebaseConfig = {};

if (configString) {
  try {
    firebaseConfig = JSON.parse(configString);
  } catch (e) {
    console.error("FIREBASE CONFIG ERROR: Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG JSON string.", e);
  }
}

// Ensure the config has the minimum required information to prevent a crash
if (!firebaseConfig.apiKey) {
    console.error("FIREBASE FATAL ERROR: apiKey is missing in NEXT_PUBLIC_FIREBASE_CONFIG. Check Vercel environment variable setup.");
}

// 2. Initializes the app only once
// This prevents the "Firebase App named '[DEFAULT]' already exists" error.
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// 3. Initialize and export the services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;


---

