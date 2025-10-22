
"use client"

import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "ranktrackerpro-studio.firebaseapp.com",
    projectId: "ranktrackerpro-studio",
    storageBucket: "ranktrackerpro-studio.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

export { app, db, auth };
