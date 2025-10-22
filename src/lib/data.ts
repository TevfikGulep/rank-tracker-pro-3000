
"use client"

import { collection, getDocs, doc, getDoc, addDoc, query, Timestamp, where, type Firestore } from 'firebase/firestore';
import type { Project, Keyword, RankHistory } from './types';

export const getProjects = async (db: Firestore, userId: string): Promise<Project[]> => {
    const q = query(collection(db, 'users', userId, 'projects'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
};

export const getProject = async (db: Firestore, userId: string, projectId: string): Promise<Project | null> => {
  const docRef = doc(db, 'users', userId, 'projects', projectId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Project;
  } else {
    console.warn(`Project with id ${projectId} not found for user ${userId}`);
    return null;
  }
};

export const getKeywordsForProject = async (db: Firestore, userId: string, projectId: string): Promise<Keyword[]> => {
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

export const addProject = async (db: Firestore, userId: string, project: Omit<Project, 'id' | 'ownerId'>): Promise<Project> => {
    const newProject = { ...project, ownerId: userId };
    const docRef = await addDoc(collection(db, 'users', userId, 'projects'), newProject);
    return { id: docRef.id, ...newProject };
};

export const addKeyword = async (db: Firestore, userId: string, projectId: string, keywordData: Omit<Keyword, 'id' | 'projectId' | 'history'>): Promise<Keyword> => {
    const initialHistory: RankHistory = {
        date: new Date().toISOString(),
        rank: null,
    };
    
    const newKeywordForDb = {
        ...keywordData,
        projectId,
        history: [
            { ...initialHistory, date: Timestamp.fromDate(new Date(initialHistory.date)) }
        ]
    };

    const docRef = await addDoc(collection(db, 'users', userId, 'projects', projectId, 'keywords'), newKeywordForDb);
    
    return { 
        id: docRef.id, 
        projectId,
        name: keywordData.name,
        country: keywordData.country,
        history: [initialHistory] 
    };
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
