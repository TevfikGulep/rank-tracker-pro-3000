
'use server'

import * as admin from 'firebase-admin';
import { getJson } from "serpapi";
import { ServiceAccount } from 'firebase-admin';

// Helper function to safely initialize Firebase Admin
function initializeFirebaseAdmin() {
  // Check if the app is already initialized
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString || serviceAccountString.trim() === '') {
      throw new Error("Sunucu yapılandırması eksik: FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı veya boş.");
    }
    
    const serviceAccount = JSON.parse(serviceAccountString);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    return admin.firestore();

  } catch (error: any) {
    console.error("Firebase Admin başlatılamadı:", error.message);
    throw new Error(`Firebase Admin başlatılamadı: ${error.message}`);
  }
}

async function getRankForKeyword(keyword: string, domain: string, country: string): Promise<number | null> {
    try {
        const serpApiKey = process.env.SERPAPI_KEY;
        if (!serpApiKey) {
            console.error("SERPAPI_KEY ortam değişkeni bulunamadı!");
            throw new Error("SERP API anahtarı eksik.");
        }

        const response = await getJson({
            engine: "google",
            q: keyword,
            location: country,
            api_key: serpApiKey,
            num: 100, // Check top 100 results
        });

        const organicResults = response.organic_results;
        if (!organicResults || organicResults.length === 0) {
            return null;
        }

        const rank = organicResults.findIndex((result: any) => result.link && result.link.includes(domain)) + 1;
        
        return rank > 0 ? rank : null;
    } catch (error: any) {
        console.error(`'${keyword}' için sıra alınırken hata oluştu:`, error.message);
        return null; // Return null on error to not break the entire scan
    }
}


export async function runScanAction(): Promise<{ success: boolean; message: string; scannedKeywords?: number; error?: string; }> {
    console.log("Tarama Eylemi Başlatıldı.");
    try {
        const db = initializeFirebaseAdmin();
        let totalScannedKeywords = 0;

        console.log("Adım 1: Tüm 'projects' alt koleksiyonları getiriliyor...");
        const projectsSnapshot = await db.collectionGroup('projects').get();
        
        if (projectsSnapshot.empty) {
            console.log("Veritabanında hiç proje bulunamadı. İşlem sonlandırılıyor.");
            return { success: true, message: "Veritabanında taranacak proje bulunamadı.", scannedKeywords: 0 };
        }
        
        console.log(`${projectsSnapshot.size} proje bulundu.`);

        for (const projectDoc of projectsSnapshot.docs) {
            const projectData = projectDoc.data();
            console.log(`Proje işleniyor: ${projectDoc.id} (${projectData.name})`);

            const keywordsSnapshot = await projectDoc.ref.collection('keywords').get();
            if (keywordsSnapshot.empty) {
                console.log(`Proje ${projectDoc.id} için hiç anahtar kelime bulunamadı.`);
                continue; // Sonraki projeye geç
            }
            console.log(`Proje ${projectDoc.id} için ${keywordsSnapshot.size} anahtar kelime bulundu.`);

            for (const keywordDoc of keywordsSnapshot.docs) {
                const keywordData = keywordDoc.data();
                
                if (!keywordData.name || !projectData.domain || !keywordData.country) {
                    console.warn(`Anahtar kelime ${keywordDoc.id} eksik bilgiye sahip, atlanıyor.`);
                    continue;
                }

                const rank = await getRankForKeyword(keywordData.name, projectData.domain, keywordData.country);
                
                const newHistoryRecord = {
                    date: admin.firestore.Timestamp.now(),
                    rank: rank,
                };

                await keywordDoc.ref.update({
                    history: admin.firestore.FieldValue.arrayUnion(newHistoryRecord)
                });

                totalScannedKeywords++;
            }
        }
        
        const successMessage = `${totalScannedKeywords} anahtar kelime başarıyla tarandı ve güncellendi.`;
        console.log(successMessage);
        return { success: true, message: successMessage, scannedKeywords: totalScannedKeywords };

    } catch (error: any) {
        console.error("Tarama işlemi sırasında kritik bir hata oluştu:", error);
        const errorMessage = `Tarama işlemi sırasında bir hata oluştu: ${error.message}`;
        return { success: false, message: errorMessage, error: errorMessage };
    }
}
