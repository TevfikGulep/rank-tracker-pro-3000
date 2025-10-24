
'use server'

import * as admin from 'firebase-admin';
import { getJson } from "serpapi";
import { ServiceAccount } from 'firebase-admin';

// Helper function to safely initialize Firebase Admin
function initializeFirebaseAdmin() {
  console.log("--- [Admin Init] Başlatılıyor ---");

  // Check if the app is already initialized
  if (admin.apps.length > 0) {
    console.log("OK: [Admin Init] Firebase Admin zaten başlatılmış.");
    return admin.firestore();
  }

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountString || serviceAccountString.trim() === '') {
      console.error("KRİTİK HATA: [Admin Init] FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı veya boş.");
      throw new Error("Sunucu yapılandırması eksik: FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı veya boş.");
    }
    console.log("OK: [Admin Init] FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulundu.");

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountString);
    } catch (e) {
      console.error("KRİTİK HATA: [Admin Init] FIREBASE_SERVICE_ACCOUNT ortam değişkeni geçerli bir JSON değil.");
      throw new Error("FIREBASE_SERVICE_ACCOUNT ortam değişkeni geçerli bir JSON değil.");
    }
    
    console.log("OK: [Admin Init] Ortam değişkeni başarıyla JSON olarak ayrıştırıldı. SDK başlatılıyor...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("OK: [Admin Init] Firebase Admin başarıyla başlatıldı.");
    return admin.firestore();

  } catch (error: any) {
    console.error("KRİTİK HATA: [Admin Init] Başlatma sırasında genel hata.");
    console.error("Hata Mesajı:", error.message);
    if (error.stack) {
      console.error("Hata Yığını:", error.stack);
    }
    throw new Error(`Firebase Admin başlatılamadı: ${error.message}`);
  }
}

async function getRankForKeyword(keyword: string, domain: string, country: string): Promise<number | null> {
    console.log(`--- [Rank Check] '${keyword}' için başlatıldı (Domain: ${domain}, Ülke: ${country}) ---`);
    try {
        const serpApiKey = process.env.SERPAPI_KEY;
        if (!serpApiKey) {
            console.error("KRİTİK HATA: [Rank Check] SERPAPI_KEY ortam değişkeni bulunamadı!");
            throw new Error("SERP API anahtarı eksik.");
        }
        console.log("OK: [Rank Check] SERPAPI_KEY bulundu.");

        const response = await getJson({
            engine: "google",
            q: keyword,
            location: country,
            api_key: serpApiKey,
            num: 100, // Check top 100 results
        });

        const organicResults = response.organic_results;
        if (!organicResults || organicResults.length === 0) {
            console.log(`UYARI: [Rank Check] '${keyword}' için organik sonuç bulunamadı.`);
            return null;
        }

        const rank = organicResults.findIndex((result: any) => result.link && result.link.includes(domain)) + 1;
        
        console.log(`OK: [Rank Check] '${keyword}' için sıra bulundu: ${rank > 0 ? rank : 'Bulunamadı (İlk 100 içinde değil)'}`);
        return rank > 0 ? rank : null;
    } catch (error: any) {
        console.error(`--- HATA: [Rank Check] ('${keyword}') ---`);
        console.error("Hata Mesajı:", error.message);
        return null;
    }
}


export async function runScanAction(): Promise<{ success: boolean; message: string; scannedKeywords?: number; error?: string; }> {
    console.log("--- [Scan Action] Tarama Eylemi Başlatıldı ---");
    try {
        const db = initializeFirebaseAdmin();
        let totalScannedKeywords = 0;

        console.log("Adım 1: 'users' koleksiyonu getiriliyor...");
        const usersSnapshot = await db.collection('users').get();
        
        if (usersSnapshot.empty) {
            console.log("UYARI: [Scan Action] Veritabanında hiç kullanıcı bulunamadı. İşlem sonlandırılıyor.");
            return { success: true, message: "Veritabanında tarayacak kullanıcı bulunamadı.", scannedKeywords: 0 };
        }
        
        console.log(`OK: [Scan Action] ${usersSnapshot.size} kullanıcı bulundu.`);

        for (const userDoc of usersSnapshot.docs) {
            console.log(`--- Kullanıcı işleniyor: ${userDoc.id} ---`);
            
            const projectsSnapshot = await userDoc.ref.collection('projects').get();
             if (projectsSnapshot.empty) {
                console.log(`UYARI: Kullanıcı ${userDoc.id} için hiç proje bulunamadı.`);
                continue; // Sonraki kullanıcıya geç
            }
            console.log(`OK: Kullanıcı ${userDoc.id} için ${projectsSnapshot.size} proje bulundu.`);

            for (const projectDoc of projectsSnapshot.docs) {
                const projectData = projectDoc.data();
                console.log(`--- Proje işleniyor: ${projectDoc.id} (${projectData.name}) ---`);

                const keywordsSnapshot = await projectDoc.ref.collection('keywords').get();
                if (keywordsSnapshot.empty) {
                    console.log(`UYARI: Proje ${projectDoc.id} için hiç anahtar kelime bulunamadı.`);
                    continue; // Sonraki projeye geç
                }
                console.log(`OK: Proje ${projectDoc.id} için ${keywordsSnapshot.size} anahtar kelime bulundu.`);

                for (const keywordDoc of keywordsSnapshot.docs) {
                    const keywordData = keywordDoc.data();
                    console.log(`--- Anahtar kelime taranıyor: ${keywordDoc.id} ('${keywordData.name}') ---`);

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
        console.log(`--- [Scan Action] BAŞARILI ---`);
        console.log(successMessage);
        return { success: true, message: successMessage, scannedKeywords: totalScannedKeywords };

    } catch (error: any) {
        console.error("--- [Scan Action] KRİTİK HATA ---");
        console.error("Hata Mesajı:", error.message);
        if (error.stack) {
            console.error("Hata Yığını:", error.stack);
        }
        const errorMessage = `Tarama işlemi sırasında bir hata oluştu: ${error.message}`;
        return { success: false, message: errorMessage, error: errorMessage };
    } finally {
        console.log("--- [Scan Action] Tarama Eylemi Tamamlandı ---");
    }
}
