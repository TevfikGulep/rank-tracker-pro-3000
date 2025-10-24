
'use server'

import * as admin from 'firebase-admin';

// Helper function to safely initialize Firebase Admin
function initializeFirebaseAdmin() {
  // Check if the app is already initialized
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  try {
    // App Hosting provides the service account credentials via an environment variable.
    // This is the recommended and secure way.
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      // This error will be thrown if the secret is not set in the App Hosting backend.
      throw new Error('FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı veya boş. Lütfen App Hosting arka ucunda ayarlayın.');
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

// New function using Google Custom Search JSON API
async function getRankForKeyword(keyword: string, domain: string): Promise<number | null> {
    // These values are expected to be set as environment variables in the App Hosting backend.
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
        const errorMessage = "Google API Anahtarı veya Arama Motoru Kimliği sunucu ortamında ayarlanmamış.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(keyword)}`;

    try {
        console.log(`'${keyword}' için Google Custom Search API ile sıra aranıyor...`);
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error(`Google API Hatası (${keyword}):`, data.error.message);
            // Don't throw for a single keyword error, just return null
            return null; 
        }

        if (!data.items || data.items.length === 0) {
            console.log(`'${keyword}' için sonuç bulunamadı.`);
            return null;
        }

        const rank = data.items.findIndex((item: any) => item.link && item.link.includes(domain)) + 1;

        console.log(`'${keyword}' için bulunan sıra: ${rank > 0 ? rank : 'Bulunamadı'}.`);
        return rank > 0 ? rank : null;

    } catch (error: any) {
        console.error(`'${keyword}' için sıra alınırken kritik hata oluştu:`, error.message);
        // On network or other critical errors, return null to not break the entire scan for other keywords
        return null;
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
                 console.log(`Anahtar kelime kontrol ediliyor: '${keywordData.name}'`);
                
                // Firestore Timestamps need to be handled carefully on the server
                const history = keywordData.history || [];
                const lastScan = history.length > 0 ? history[history.length - 1] : null;
                let shouldScan = true;
                if (lastScan && lastScan.date) {
                    // lastScan.date will be a Firestore Timestamp
                    const lastScanDate = lastScan.date.toDate();
                    const oneDayAgo = new Date();
                    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
                    if (lastScanDate > oneDayAgo) {
                        console.log(`Anahtar kelime '${keywordData.name}' son 24 saat içinde tarandığı için atlanıyor.`);
                        shouldScan = false;
                    }
                }

                if (!shouldScan) {
                    continue;
                }

                if (!keywordData.name || !projectData.domain) {
                    console.warn(`Anahtar kelime ${keywordDoc.id} eksik bilgiye sahip (isim veya domain), atlanıyor.`);
                    continue;
                }

                // Call the new Google Custom Search API function
                const rank = await getRankForKeyword(keywordData.name, projectData.domain);
                
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
