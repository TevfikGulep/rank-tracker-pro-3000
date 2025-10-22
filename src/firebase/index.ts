'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// This function ensures Firebase is initialized only once.
export function initializeFirebase() {
  let app: FirebaseApp;
  try {
    // Attempt to get the already initialized app.
    app = getApp();
  } catch (e) {
    // If it's not initialized, initialize it now.
    app = initializeApp(firebaseConfig);
  }
  return getSdks(app);
}


export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './errors';
export * from './error-emitter';
