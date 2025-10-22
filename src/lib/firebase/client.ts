
"use client"
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


function initializeClientApp() {
    if (getApps().length > 0) {
        return getApp();
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error("Firebase config is missing. Ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set in your .env.local file.");
        // Return a dummy object or throw an error to prevent further execution
        // For now, we'll let it fail on initializeApp to match the original error,
        // but the console error will point to the root cause.
    }
    
    return initializeApp(firebaseConfig);
}


const app = initializeClientApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
