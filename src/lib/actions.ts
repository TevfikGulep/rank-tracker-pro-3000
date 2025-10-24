
'use server'

import * as admin from 'firebase-admin';
import { getJson } from "serpapi";
import { ServiceAccount } from 'firebase-admin';

// Helper function to safely initialize Firebase Admin
function initializeFirebaseAdmin() {
  // Check if the app is already initialized
  if (admin.apps.length > 0) {
    console.log("Firebase Admin zaten başlatılmış.");
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
    
    console.log("Firebase Admin başarıyla başlatıldı.");
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

        console.log(`'${keyword}' için '${country}' ülkesinde sıra aranıyor...`);
        const response = await getJson({
            engine: "google",
            q: keyword,
            location: country,
            api_key: serpApiKey,
            num: 100, // Check top 100 results
        });

        const organicResults = response.organic_results;
        if (!organicResults || organicResults.length === 0) {
            console.log(`'${keyword}' için organik sonuç bulunamadı.`);
            return null;
        }

        const rank = organicResults.findIndex((result: any) => result.link && result.link.includes(domain)) + 1;
        
        console.log(`'${keyword}' için bulunan sıra: ${rank > 0 ? rank : 'Bulunamadı'}.`);
        return rank > 0 ? rank : null;
    } catch (error: any) {
        console.error(`'${keyword}' için sıra alınırken hata oluştu:`, error.message);
        return null; // Return null on error to not break the entire scan
    }
}

function shouldScanKeyword(history: any[]): boolean {
    // 1. Henüz hiç taranmamışsa (geçmişi boşsa) kesinlikle tara.
    if (!history || history.length === 0) {
        console.log("Geçmiş boş, taranacak.");
        return true; 
    }
    
    const lastScan = history[history.length - 1];

    // 2. Geçmiş var ama son taramada sıra alınamamışsa (rank: null) tekrar tara.
    // Bu, yeni eklenip henüz hiç başarılı sıra alamamış anahtar kelimeleri yakalar.
    if (lastScan.rank === null) {
        console.log("Son sıra null, taranacak.");
        return true;
    }
    
    // 3. Son taramanın tarihi geçersizse, tedbiren tara.
    if (!lastScan.date || typeof lastScan.date.toDate !== 'function') {
        console.log("Geçersiz tarih, taranacak.");
        return true; 
    }
    
    // 4. Son tarama 7 günden eskiyse tara.
    const lastScanDate = lastScan.date.toDate();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const isOld = lastScanDate < sevenDaysAgo;
    if (isOld) {
        console.log("Son tarama 7 günden eski, taranacak.");
    } else {
        console.log("Son tarama 7 günden yeni, atlanacak.");
    }
    return isOld;
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
                 console.log(`Anahtar kelime kontrol ediliyor: '${keywordData.name}'`);
                
                if (!shouldScanKeyword(keywordData.history)) {
                    console.log(`Anahtar kelime '${keywordData.name}' son 7 gün içinde tarandığı için atlanıyor.`);
                    continue;
                }

                if (!keywordData.name || !projectData.domain || !keywordData.country) {
                    console.warn(`Anahtar kelime ${keywordDoc.id} eksik bilgiye sahip (isim, domain veya ülke), atlanıyor.`);
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
