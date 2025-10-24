'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// This function ensures Firebase is initialized only once.
function initializeFirebaseClient() {
  if (getApps().length > 0) {
    return getApp();
  }

  // process.env.FIREBASE_WEBAPP_CONFIG is automatically provided by App Hosting.
  const firebaseConfigString = process.env.FIREBASE_WEBAPP_CONFIG;
  if (!firebaseConfigString) {
    throw new Error(
      'Firebase web app config not found. Make sure you are running in a Firebase App Hosting environment.'
    );
  }
  const firebaseConfig = JSON.parse(firebaseConfigString);
  return initializeApp(firebaseConfig);
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    const app = initializeFirebaseClient();
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
