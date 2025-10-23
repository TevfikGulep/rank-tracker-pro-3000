
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

// Helper to initialize the admin app idempotently
function initializeAdminApp() {
  // If the app is already initialized, return the existing instance.
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  // Let the SDK automatically find the credentials in the environment.
  // This is the standard way for App Hosting and other Google Cloud environments.
  return admin.initializeApp();
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
  let db: admin.firestore.Firestore;
  try {
    const adminApp = initializeAdminApp();
    db = getAdminFirestore(adminApp);
  } catch (e: any) {
    const errorMessage = `Could not initialize Firebase Admin. This is required for server-side admin actions. Error: ${e.message}`;
    console.error(`SCAN FAILED: ${errorMessage}`);
    return { success: false, scannedCount: 0, error: errorMessage };
  }

  try {
    // Firestore operations with client SDK types require casting for admin SDK
    const clientDb = db as unknown as Firestore;
    const allProjects = await getProjects(clientDb, userId);
    let totalKeywordsScanned = 0;

    for (const project of allProjects) {
      const keywords = await getKeywordsForProject(clientDb, userId, project.id);

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
          clientDb,
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
