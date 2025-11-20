import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // <-- ADD THIS IMPORT

// 1. Configuration relies on parsing a single JSON string from the environment.
const configString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
let firebaseConfig = {};

if (configString) {
  try {
    firebaseConfig = JSON.parse(configString);
  } catch (e) {
    console.error("FIREBASE CONFIG ERROR: Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG JSON string.", e);
  }
}

// Ensure the config has the minimum required information
if (!firebaseConfig.apiKey) {
    console.error("FIREBASE FATAL ERROR: apiKey is missing. Check Base64 string in Vercel ENV.");
}

// 2. Initializes the app only once
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// 3. Initialize and export the services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // <-- ADD THIS EXPORT

export default app;