
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This function ensures Firebase is initialized only once, which is crucial in a Next.js environment
// where code can run on both the server and the client.
export function initializeFirebase() {
  // process.env.FIREBASE_WEBAPP_CONFIG is available in the build environment
  const firebaseConfigString = process.env.FIREBASE_WEBAPP_CONFIG;
  if (!firebaseConfigString) {
    // Fallback for local development if you were to use a config file, but we'll rely on the provider.
    // This part of the code is less likely to be hit when using the provider pattern correctly.
    throw new Error("Firebase config not found. Ensure FIREBASE_WEBAPP_CONFIG is set.");
  }
   const firebaseConfig = JSON.parse(firebaseConfigString);

  // Check if any apps are already initialized. If not, initialize one.
  // Otherwise, get the existing default app.
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './errors';
export * from './error-emitter';
