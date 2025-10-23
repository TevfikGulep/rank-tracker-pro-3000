
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, Timestamp, where, type Firestore } from 'firebase/firestore';
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
      // Ensure history is an array before mapping
      const history = Array.isArray(data.history) ? data.history.sort((a, b) => new Date(a.date.seconds * 1000).getTime() - new Date(b.date.seconds * 1000).getTime()) : [];
      return {
          id: doc.id,
          ...data,
          history: history.map((h: any) => ({
              ...h,
              date: h.date instanceof Timestamp ? h.date.toDate().toISOString() : h.date
          }))
      } as Keyword
  }).sort((a,b) => a.name.localeCompare(b.name));
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

export const updateKeyword = async (db: Firestore, userId: string, projectId: string, keywordId: string, keywordData: Omit<Keyword, 'id' | 'projectId' | 'history'>): Promise<Keyword> => {
    const keywordRef = doc(db, 'users', userId, 'projects', projectId, 'keywords', keywordId);
    await updateDoc(keywordRef, keywordData);
    const updatedDoc = await getDoc(keywordRef);
    const data = updatedDoc.data();
    const history = Array.isArray(data?.history) ? data.history.sort((a, b) => new Date(a.date.seconds * 1000).getTime() - new Date(b.date.seconds * 1000).getTime()) : [];
    return {
        id: updatedDoc.id,
        ...data,
        history: history.map((h: any) => ({
            ...h,
            date: h.date instanceof Timestamp ? h.date.toDate().toISOString() : h.date,
        })),
    } as Keyword;
};

export const deleteKeyword = async (db: Firestore, userId: string, projectId: string, keywordId: string): Promise<void> => {
    const keywordRef = doc(db, 'users', userId, 'projects', projectId, 'keywords', keywordId);
    await deleteDoc(keywordRef);
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
