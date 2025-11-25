import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // <-- ADD THIS IMPORT

const firebaseConfig = {
    // 💡 Must use the VITE_ prefix as defined on Vercel
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

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