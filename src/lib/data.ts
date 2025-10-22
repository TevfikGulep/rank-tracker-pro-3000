
"use client"

import { db } from './firebase/client';
import { collection, getDocs, doc, getDoc, addDoc, query, Timestamp } from 'firebase/firestore';
import type { Project, Keyword, RankHistory } from './types';
import { auth } from './firebase/client';

const getCurrentUserId = (): string => {
  if (!auth.currentUser) {
    throw new Error("Not authenticated");
  }
  return auth.currentUser.uid;
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  const userId = getCurrentUserId();
  const docRef = doc(db, 'users', userId, 'projects', projectId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Project;
  } else {
    return null;
  }
};

export const getKeywordsForProject = async (projectId: string): Promise<Keyword[]> => {
  const userId = getCurrentUserId();
  const q = query(collection(db, 'users', userId, 'projects', projectId, 'keywords'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
          id: doc.id,
          ...data,
          history: data.history.map((h: any) => ({
              ...h,
              date: h.date instanceof Timestamp ? h.date.toDate().toISOString() : h.date
          }))
      } as Keyword
  });
};

export const addProject = async (project: Omit<Project, 'id'>): Promise<Project> => {
    const userId = getCurrentUserId();
    const docRef = await addDoc(collection(db, 'users', userId, 'projects'), project);
    return { id: docRef.id, ...project };
};

export const addKeyword = async (projectId: string, keywordData: Omit<Keyword, 'id' | 'projectId' | 'history'>): Promise<Keyword> => {
    const userId = getCurrentUserId();
    const initialHistory: RankHistory = {
        date: new Date().toISOString(),
        rank: null,
    };
    const newKeyword = {
        ...keywordData,
        projectId,
        history: [initialHistory],
    };
    const docRef = await addDoc(collection(db, 'users', userId, 'projects', projectId, 'keywords'), {
        ...keywordData,
        history: [
            { ...initialHistory, date: Timestamp.fromDate(new Date(initialHistory.date)) }
        ]
    });
    return { id: docRef.id, ...newKeyword };
};

export const countries = [
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Türkiye', label: 'Türkiye' },
];
