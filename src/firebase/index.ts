'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This function ensures Firebase is initialized only once.
// initializeApp is idempotent, meaning if an app with the same name
// is already initialized, it will return the existing instance instead of creating a new one.
// This is the safest way to initialize in a Next.js environment.
export function initializeFirebase() {
  const app = initializeApp(firebaseConfig);
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
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