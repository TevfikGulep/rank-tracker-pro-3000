
'use server';

import { getKeywordsForProject, getProjects } from './data';
import {
  type Firestore,
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { getJson } from 'serpapi';
import * as admin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';


// Helper to initialize the admin app
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set. This is required for server-side admin actions.');
  }

  try {
    const serviceAccountJson = JSON.parse(serviceAccount);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccountJson),
    });
  } catch (error: any) {
    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${error.message}`);
  }
}


// Helper function to get rank
async function getGoogleRank(
  apiKey: string,
  query: string,
  domain: string,
  country: string
): Promise<number | null> {
  try {
    const response = await getJson({
      engine: 'google',
      q: query,
      location: country,
      num: 100, // Check top 100 results
      api_key: apiKey,
    });

    const organicResults = response.organic_results;
    if (!organicResults) {
      return null;
    }

    const rank = organicResults.findIndex(
      (result: any) => result.link && result.link.includes(domain)
    );

    return rank !== -1 ? rank + 1 : null;
  } catch (error) {
    console.error(`SerpApi error for query "${query}":`, error);
    // Return null to indicate the check failed, but don't stop the whole scan
    return null;
  }
}

// Server Action
export async function runScanAction(
  userId: string
): Promise<{ success: boolean; scannedCount: number; error?: string }> {
  console.log(`Starting weekly scan for user: ${userId}...`);
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    const message = 'SerpApi API key is not configured on the server.';
    console.error(`SCAN FAILED: ${message}`);
    return { success: false, scannedCount: 0, error: message };
  }

  // We need a server-side firestore instance
  let db: Firestore;
  try {
    const adminApp = initializeAdminApp();
    db = getAdminFirestore(adminApp) as unknown as Firestore;
  } catch (e: any) {
    console.error(`SCAN FAILED: Could not initialize Firebase Admin. ${e.message}`);
    return { success: false, scannedCount: 0, error: `Could not initialize Firebase Admin: ${e.message}` };
  }


  try {
    const allProjects = await getProjects(db, userId);
    let totalKeywordsScanned = 0;

    for (const project of allProjects) {
      const keywords = await getKeywordsForProject(db, userId, project.id);

      for (const keyword of keywords) {
        console.log(
          `  - Checking rank for: "${keyword.name}" in project "${project.name}"...`
        );

        const newRank = await getGoogleRank(
          apiKey,
          keyword.name,
          project.domain,
          keyword.country
        );

        const newHistoryEntry = {
          date: Timestamp.fromDate(new Date()),
          rank: newRank,
        };

        const keywordRef = doc(
          db,
          'users',
          userId,
          'projects',
          project.id,
          'keywords',
          keyword.id
        );

        await updateDoc(keywordRef, {
          history: arrayUnion(newHistoryEntry),
        });

        console.log(
          `  - Updated "${keyword.name}" with new rank: ${newRank ?? 'Not found'}`
        );
        totalKeywordsScanned++;
      }
    }

    console.log(
      `Weekly scan finished. Scanned ${totalKeywordsScanned} keywords for user ${userId}.`
    );
    return { success: true, scannedCount: totalKeywordsScanned };
  } catch (e: any) {
    const errorMessage = e.message || 'An unknown error occurred during the scan.';
    console.error(`SCAN FAILED: ${errorMessage}`);
    return { success: false, scannedCount: 0, error: errorMessage };
  }
}
