
'use server'

import * as admin from 'firebase-admin';
import { getJson } from "serpapi";

// Helper function to safely initialize Firebase Admin
function initializeFirebaseAdmin() {
  console.log("--- initializeFirebaseAdmin: Başlatılıyor ---");

  // Önce uygulamanın zaten başlatılıp başlatılmadığını kontrol edin
  if (admin.apps.length > 0) {
    console.log("OK: Firebase Admin zaten başlatılmış.");
    return admin.firestore();
  }

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountString) {
      console.error("--- initializeFirebaseAdmin: KRİTİK HATA ---");
      throw new Error("Sunucu yapılandırması eksik: FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı veya boş.");
    }
    console.log("OK: FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulundu.");

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountString);
    } catch (e) {
      console.error("--- initializeFirebaseAdmin: KRİTİK HATA ---");
      throw new Error("FIREBASE_SERVICE_ACCOUNT ortam değişkeni geçerli bir JSON değil.");
    }
    
    console.log("OK: Ortam değişkeni başarıyla JSON olarak ayrıştırıldı. SDK başlatılıyor...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("OK: Firebase Admin, ortam değişkenindeki servis hesabıyla başarıyla başlatıldı.");
    return admin.firestore();

  } catch (error: any) {
    console.error("--- initializeFirebaseAdmin: KRİTİK HATA ---");
    console.error("Hata Mesajı:", error.message);
    // Hatanın yığınını loglayarak daha fazla detay alın
    if (error.stack) {
      console.error("Hata Yığını:", error.stack);
    }
    // Orijinal hatayı yeniden fırlatmak yerine daha anlaşılır bir hata fırlatın
    throw new Error(`Firebase Admin başlatılamadı: ${error.message}`);
  }
}

async function getRankForKeyword(keyword: string, domain: string, country: string): Promise<number | null> {
    console.log(`--- getRankForKeyword: '${keyword}' için başlatıldı (Domain: ${domain}, Ülke: ${country}) ---`);
    try {
        const serpApiKey = process.env.SERPAPI_KEY;
        if (!serpApiKey) {
            console.error("KRİTİK HATA: SERPAPI_KEY ortam değişkeni bulunamadı!");
            throw new Error("SERP API anahtarı eksik.");
        }
        console.log("OK: SERPAPI_KEY bulundu.");

        const response = await getJson({
            engine: "google",
            q: keyword,
            location: country,
            api_key: serpApiKey,
            num: 100, // Check top 100 results
        });

        const organicResults = response.organic_results;
        if (!organicResults) {
            console.log(`UYARI: '${keyword}' için organik sonuç bulunamadı.`);
            return null;
        }

        const rank = organicResults.findIndex((result: any) => result.link && result.link.includes(domain)) + 1;
        
        console.log(`OK: '${keyword}' için sıra bulundu: ${rank > 0 ? rank : 'Bulunamadı (İlk 100 içinde değil)'}`);
        return rank > 0 ? rank : null;
    } catch (error: any) {
        console.error(`--- getRankForKeyword: HATA ('${keyword}') ---`);
        console.error("Hata Mesajı:", error.message);
        return null;
    }
}


export async function runScanAction(): Promise<{ success: boolean; message: string; scannedKeywords?: number; error?: string; }> {
    console.log("--- runScanAction: Başlatıldı ---");
    try {
        const db = initializeFirebaseAdmin();
        let totalScannedKeywords = 0;

        console.log("Adım 1: Kullanıcılar getiriliyor...");
        const usersSnapshot = await db.collection('users').get();
        if (usersSnapshot.empty) {
            console.log("UYARI: Hiç kullanıcı bulunamadı.");
        } else {
            console.log(`OK: ${usersSnapshot.docs.length} kullanıcı bulundu.`);
        }

        for (const userDoc of usersSnapshot.docs) {
            console.log(`--- Kullanıcı işleniyor: ${userDoc.id} ---`);
            
            const projectsSnapshot = await userDoc.ref.collection('projects').get();
             if (projectsSnapshot.empty) {
                console.log("UYARI: Bu kullanıcı için hiç proje bulunamadı.");
                continue;
            }
            console.log(`OK: ${projectsSnapshot.docs.length} proje bulundu.`);

            for (const projectDoc of projectsSnapshot.docs) {
                const projectData = projectDoc.data();
                console.log(`--- Proje işleniyor: ${projectDoc.id} (${projectData.name}) ---`);

                const keywordsSnapshot = await projectDoc.ref.collection('keywords').get();
                if (keywordsSnapshot.empty) {
                    console.log("UYARI: Bu proje için hiç anahtar kelime bulunamadı.");
                    continue;
                }
                console.log(`OK: ${keywordsSnapshot.docs.length} anahtar kelime bulundu.`);

                for (const keywordDoc of keywordsSnapshot.docs) {
                    const keywordData = keywordDoc.data();
                    console.log(`--- Anahtar kelime taranıyor: ${keywordDoc.id} (${keywordData.name}) ---`);

                    const rank = await getRankForKeyword(keywordData.name, projectData.domain, keywordData.country);
                    
                    const newHistoryRecord = {
                        date: admin.firestore.Timestamp.now(),
                        rank: rank,
                    };

                    await keywordDoc.ref.update({
                        history: admin.firestore.FieldValue.arrayUnion(newHistoryRecord)
                    });
                    console.log(`OK: '${keywordDoc.id}' için sıralama verisi başarıyla kaydedildi.`);

                    totalScannedKeywords++;
                }
            }
        }
        
        const successMessage = `${totalScannedKeywords} anahtar kelime başarıyla tarandı ve güncellendi.`;
        console.log(`--- runScanAction: BAŞARILI ---`);
        console.log(successMessage);
        return { success: true, message: successMessage, scannedKeywords: totalScannedKeywords };

    } catch (error: any) {
        console.error("--- runScanAction: KRİTİK HATA ---");
        console.error("Hata Mesajı:", error.message);
        if (error.stack) {
            console.error("Hata Yığını:", error.stack);
        }
        const errorMessage = `Tarama işlemi sırasında bir hata oluştu: ${error.message}`;
        return { success: false, message: errorMessage, error: errorMessage };
    } finally {
        console.log("--- runScanAction: Tamamlandı ---");
    }
}

    