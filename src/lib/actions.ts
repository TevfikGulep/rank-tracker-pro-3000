
'use server';

import * as admin from 'firebase-admin';
import { getJson } from 'serpapi';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // This will use Application Default Credentials in App Hosting
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();

type RankHistory = {
  date: admin.firestore.Timestamp;
  rank: number | null;
};

// Helper function to perform a Google search and find the rank
async function getRankForKeyword(
  keyword: string,
  domain: string,
  country: string
): Promise<number | null> {
  if (!process.env.SERPAPI_KEY) {
    console.error('SERPAPI_KEY environment variable is not set.');
    // In a real app, you might want to throw an error or handle this differently
    return null;
  }
  try {
    const response = await getJson({
      engine: 'google',
      q: keyword,
      location: country,
      api_key: process.env.SERPAPI_KEY,
    });

    const organicResults = response.organic_results;
    const rank =
      organicResults?.findIndex((result) =>
        result.link.includes(domain)
      ) ?? -1;

    return rank !== -1 ? rank + 1 : null;
  } catch (error) {
    console.error(`Error fetching rank for "${keyword}" in ${country}:`, error);
    return null;
  }
}

export async function runScanAction() {
  try {
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
      console.log('No users found.');
      return { success: true, message: 'Taranacak kullanıcı bulunamadı.' };
    }

    let totalKeywordsScanned = 0;

    // Use Promise.all to run scans in parallel for all users
    await Promise.all(usersSnapshot.docs.map(async (userDoc) => {
      const projectsSnapshot = await userDoc.ref.collection('projects').get();
      
      if (projectsSnapshot.empty) return;

      // Use Promise.all for all projects of a user
      await Promise.all(projectsSnapshot.docs.map(async (projectDoc) => {
        const project = projectDoc.data();
        const keywordsSnapshot = await projectDoc.ref.collection('keywords').get();

        if (keywordsSnapshot.empty) return;

        // Use Promise.all for all keywords of a project
        await Promise.all(keywordsSnapshot.docs.map(async (keywordDoc) => {
          const keyword = keywordDoc.data();
          const rank = await getRankForKeyword(
            keyword.name,
            project.domain,
            keyword.country
          );
          
          totalKeywordsScanned++;

          const newHistoryEntry: RankHistory = {
            date: admin.firestore.Timestamp.now(),
            rank: rank,
          };

          // It's safe to update the document here, as Promises will handle concurrency.
          await keywordDoc.ref.update({
            history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
          });
        }));
      }));
    }));

    const message = `Tarama tamamlandı. ${totalKeywordsScanned} anahtar kelime güncellendi.`;
    return { success: true, message };

  } catch (error: any) {
    console.error('An error occurred during the scan:', error);
    // Return a more specific error message to the client
    return {
      success: false,
      message: `Tarama Başarısız: ${error.message}`,
    };
  }
}
