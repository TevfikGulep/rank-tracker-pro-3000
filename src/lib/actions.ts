
'use server';

import { getJson } from 'serpapi';
import * as admin from 'firebase-admin';
import type { Project, Keyword } from './types';

// Helper to initialize the admin app idempotently
function initializeAdminApp() {
  // If the admin app is already initialized, return it.
  if (admin.apps.length) {
    return admin.app();
  }
  // Otherwise, initialize the app. In a managed environment like App Hosting,
  // initializeApp() will automatically use Application Default Credentials.
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
export async function runScanAction(userId: string): Promise<{ success: boolean; scannedCount: number; error?: string }> {
  console.log(`Starting scan for user: ${userId}...`);
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    const message = 'SerpApi API key is not configured on the server.';
    console.error(`SCAN FAILED: ${message}`);
    return { success: false, scannedCount: 0, error: message };
  }

  let db: admin.firestore.Firestore;
  try {
    const adminApp = initializeAdminApp();
    db = admin.firestore(adminApp);
  } catch (e: any) {
    const errorMessage = `Could not initialize Firebase Admin. Error: ${e.message}`;
    console.error(`SCAN FAILED: ${errorMessage}`);
    return { success: false, scannedCount: 0, error: errorMessage };
  }

  try {
    const projectsSnapshot = await db.collection(`users/${userId}/projects`).get();
    if (projectsSnapshot.empty) {
        console.log(`No projects found for user ${userId}.`);
        return { success: true, scannedCount: 0 };
    }
    const allProjects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    
    let totalKeywordsScanned = 0;

    for (const project of allProjects) {
      const keywordsSnapshot = await db.collection(`users/${userId}/projects/${project.id}/keywords`).get();
      if (keywordsSnapshot.empty) {
        console.log(`No keywords found for project ${project.name} (${project.id}).`);
        continue;
      }
      const keywords = keywordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Keyword));

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
          date: admin.firestore.Timestamp.fromDate(new Date()),
          rank: newRank,
        };

        const keywordRef = db.doc(
          `users/${userId}/projects/${project.id}/keywords/${keyword.id}`
        );

        await keywordRef.update({
          history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
        });

        console.log(
          `  - Updated "${keyword.name}" with new rank: ${newRank ?? 'Not found'}`
        );
        totalKeywordsScanned++;
      }
    }

    console.log(
      `Scan finished. Scanned ${totalKeywordsScanned} keywords for user ${userId}.`
    );
    return { success: true, scannedCount: totalKeywordsScanned };
  } catch (e: any) {
    const errorMessage = e.message || 'An unknown error occurred during the scan.';
    console.error(`SCAN FAILED for user ${userId}: ${errorMessage}`);
    return { success: false, scannedCount: 0, error: errorMessage };
  }
}
