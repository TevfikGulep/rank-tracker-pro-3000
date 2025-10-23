
'use server';

import * as admin from 'firebase-admin';
import { getJson } from 'serpapi';

// Helper function to perform a Google search and find the rank
async function getRankForKeyword(
  keyword: string,
  domain: string,
  country: string
): Promise<number | null> {
  console.log(`[SCAN] Checking rank for keyword: "${keyword}" in ${country} for domain: ${domain}`);
  
  if (!process.env.SERPAPI_KEY) {
    console.error('[ERROR] SERPAPI_KEY environment variable is not set.');
    // In a real app, you might want to throw an error or handle this differently
    return null;
  }
  
  try {
    const response = await getJson({
      engine: 'google',
      q: keyword,
      location: country,
      api_key: process.env.SERPAPI_KEY,
      num: 100, // Check top 100 results
    });

    const organicResults = response.organic_results;
    if (!organicResults) {
        console.warn(`[WARN] No organic results found for "${keyword}" in ${country}.`);
        return null;
    }

    const rank = organicResults.findIndex((result) => result.link && result.link.includes(domain)) ?? -1;

    const finalRank = rank !== -1 ? rank + 1 : null;
    console.log(`[SUCCESS] Rank for "${keyword}" is: ${finalRank}`);
    return finalRank;

  } catch (error) {
    console.error(`[ERROR] SerpAPI failed for "${keyword}" in ${country}:`, error);
    return null;
  }
}

export async function runScanAction() {
  console.log('[START] Running scan action...');

  try {
    // Initialize Firebase Admin SDK if not already initialized
    if (!admin.apps.length) {
      console.log('[INFO] Firebase Admin SDK not initialized. Attempting to initialize...');
      try {
        admin.initializeApp();
        console.log('[SUCCESS] Firebase Admin SDK initialized successfully.');
      } catch (initError) {
        console.error('[FATAL] Firebase Admin SDK initialization failed:', initError);
        return { success: false, message: `SDK Başlatma Hatası: ${initError instanceof Error ? initError.message : 'Bilinmeyen Hata'}` };
      }
    } else {
      console.log('[INFO] Firebase Admin SDK already initialized.');
    }

    const db = admin.firestore();
    console.log('[INFO] Firestore database instance obtained.');

    const usersSnapshot = await db.collection('users').get();
    console.log(`[INFO] Found ${usersSnapshot.size} users.`);

    if (usersSnapshot.empty) {
      console.log('[END] No users found to scan.');
      return { success: true, message: 'Taranacak kullanıcı bulunamadı.' };
    }

    let totalKeywordsScanned = 0;

    for (const userDoc of usersSnapshot.docs) {
      console.log(`[INFO] Processing user: ${userDoc.id}`);
      const projectsSnapshot = await userDoc.ref.collection('projects').get();
      console.log(`[INFO] User ${userDoc.id} has ${projectsSnapshot.size} projects.`);

      for (const projectDoc of projectsSnapshot.docs) {
        const project = projectDoc.data();
        console.log(`[INFO] Processing project: ${projectDoc.id} (${project.name}) for domain: ${project.domain}`);
        const keywordsSnapshot = await projectDoc.ref.collection('keywords').get();
        console.log(`[INFO] Project ${projectDoc.id} has ${keywordsSnapshot.size} keywords.`);

        for (const keywordDoc of keywordsSnapshot.docs) {
          const keyword = keywordDoc.data();
          console.log(`[INFO] Scanning keyword: ${keyword.name}`);
          
          try {
            const rank = await getRankForKeyword(
              keyword.name,
              project.domain,
              keyword.country
            );
            
            totalKeywordsScanned++;

            const newHistoryEntry = {
              date: admin.firestore.Timestamp.now(),
              rank: rank,
            };
            
            console.log(`[INFO] Updating keyword ${keywordDoc.id} with new rank: ${rank}`);
            await keywordDoc.ref.update({
              history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
            });
            console.log(`[SUCCESS] Successfully updated keyword ${keywordDoc.id}.`);

          } catch (keywordError) {
             console.error(`[ERROR] Failed to process keyword ${keyword.name} for project ${projectDoc.id}:`, keywordError);
          }
        }
      }
    }

    const message = `Tarama tamamlandı. ${totalKeywordsScanned} anahtar kelime güncellendi.`;
    console.log(`[END] ${message}`);
    return { success: true, message };

  } catch (error: any) {
    console.error('[FATAL] An unexpected error occurred during the scan action:', error);
    console.error('Error Details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    // Return a more specific error message to the client
    return {
      success: false,
      message: `Tarama Başarısız: ${error.message}`,
    };
  }
}
