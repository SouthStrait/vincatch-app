import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Function to safely decode Base64 in the Browser environment
const decodeBase64 = (encodedString) => {
    // We rely on the browser's native atob() function for decoding.
    try {
        const decoded = atob(encodedString);
        return decoded;
    } catch (e) {
        console.error("Base64 decoding failed:", e);
        return "{}"; // Return empty object string on failure
    }
};

// 1. Get the Base64 encoded string from Vercel
const encodedConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
let firebaseConfig = {};

if (encodedConfig) {
  try {
    // Decode the string and parse the resulting JSON
    const decodedString = decodeBase64(encodedConfig);
    // Use JSON.parse() on the decoded string
    firebaseConfig = JSON.parse(decodedString);
  } catch (e) {
    console.error("FIREBASE CONFIG ERROR: Failed to parse Base64 config JSON.", e);
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

export default app;