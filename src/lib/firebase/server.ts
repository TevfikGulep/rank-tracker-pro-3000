import "server-only";

import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';


const serviceAccount: ServiceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const auth = getAuth();
export const db = getFirestore();


auth.verifySessionCookie = async function (sessionCookie?: string | undefined, checkRevoked?: boolean) {
    if (!sessionCookie) {
        return {
            currentUser: null,
            error: "Session cookie not found"
        }
    }
    try {
        const decodedIdToken = await getAuth().verifySessionCookie(
            sessionCookie,
            checkRevoked
        );
        const currentUser = await getAuth().getUser(decodedIdToken.uid)
        return {
            currentUser,
            error: null
        }
    } catch (error) {
        return {
            currentUser: null,
            error: "Failed to verify session cookie"
        }
    }
};

type LoginRequest = NextRequest & {
    logIn: (user: any, options: any) => Promise<void>;
};

auth.handleLogin = async function (req: LoginRequest) {
    const authorization = req.headers.get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
      const idToken = authorization.split("Bearer ")[1];
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
      cookies().set("session", sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: true,
        path: "/",
      });
      return new Response(JSON.stringify({ status: "success" }), { status: 200 });
    }
    return new Response(null, { status: 401 });
};

auth.handleLogout = async function () {
    cookies().delete("session");
    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
}
