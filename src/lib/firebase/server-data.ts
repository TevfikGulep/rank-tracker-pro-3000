
import "server-only";

import { db } from './server';
import { collection, getDocs, query } from 'firebase/firestore';
import type { Project } from '../types';
import { auth } from './server';
import { cookies } from 'next/headers';

async function getCurrentUserId(): Promise<string> {
  const sessionCookie = cookies().get('session')?.value;
  const { currentUser } = await auth.verifySessionCookie(sessionCookie);
  if (!currentUser) {
    throw new Error("Not authenticated");
  }
  return currentUser.uid;
}

export const getProjects = async (): Promise<Project[]> => {
  const userId = await getCurrentUserId();
  const q = query(collection(db, 'users', userId, 'projects'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
};
