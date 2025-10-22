
"use client"

import { db, auth } from './firebase/client';
import { collection, getDocs, doc, getDoc, addDoc, query, Timestamp, where } from 'firebase/firestore';
import type { Project, Keyword, RankHistory } from './types';
import { onAuthStateChanged } from "firebase/auth";


// Firebase auth nesnesinin yüklenmesini beklemek için bir yardımcı fonksiyon
const waitForAuth = () => {
  return new Promise<string>((resolve, reject) => {
    if (auth.currentUser) {
      return resolve(auth.currentUser.uid);
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user.uid);
        unsubscribe();
      } else {
        // Bu durum, korumalı bir rotada oturum olmadan çağrı yapıldığında olabilir.
        // Layout zaten yönlendirme yapmalı, ama bir güvenlik önlemi olarak.
        reject(new Error("Kullanıcı oturumu bulunamadı."));
      }
    });
  });
};


export const getProject = async (projectId: string): Promise<Project | null> => {
  const userId = await waitForAuth();
  const docRef = doc(db, 'users', userId, 'projects', projectId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Project;
  } else {
    console.warn(`Project with id ${projectId} not found for user ${userId}`);
    return null;
  }
};

export const getKeywordsForProject = async (projectId: string): Promise<Keyword[]> => {
  const userId = await waitForAuth();
  const q = query(collection(db, 'users', userId, 'projects', projectId, 'keywords'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
          id: doc.id,
          ...data,
          // Firestore Timestamp'i ISO string'e çevir
          history: data.history.map((h: any) => ({
              ...h,
              date: h.date instanceof Timestamp ? h.date.toDate().toISOString() : h.date
          }))
      } as Keyword
  });
};

export const addProject = async (project: Omit<Project, 'id'>): Promise<Project> => {
    const userId = await waitForAuth();
    const docRef = await addDoc(collection(db, 'users', userId, 'projects'), project);
    return { id: docRef.id, ...project };
};

export const addKeyword = async (projectId: string, keywordData: Omit<Keyword, 'id' | 'projectId' | 'history'>): Promise<Keyword> => {
    const userId = await waitForAuth();
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
