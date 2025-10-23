
'use server'

import * as admin from 'firebase-admin';
import { getJson } from "serpapi";

// Helper function to safely initialize Firebase Admin
function initializeFirebaseAdmin() {
  console.log("--- initializeFirebaseAdmin: Başlatılıyor ---");
  try {
    if (admin.apps.length > 0) {
      console.log("UYARI: Firebase Admin zaten başlatılmış.");
      return admin.firestore();
    }

    // Ortam değişkenini kontrol et
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.error("KRİTİK HATA: FIREBASE_SERVICE_ACCOUNT ortam değişkeni ayarlanmamış!");
      throw new Error("Sunucu yapılandırması eksik: Servis hesabı anahtarı bulunamadı.");
    }
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("OK: Servis hesabı JSON'u başarıyla ayrıştırıldı.");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("OK: Firebase Admin başarıyla başlatıldı.");
    return admin.firestore();
  } catch (error: any) {
    console.error("--- initializeFirebaseAdmin: HATA ---");
    console.error("Hata Mesajı:", error.message);
    console.error("Hata Yığını:", error.stack);
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
        });

        const organicResults = response.organic_results;
        if (!organicResults) {
            console.log(`UYARI: '${keyword}' için organik sonuç bulunamadı.`);
            return null;
        }

        const rank = organicResults.findIndex(result => result.link && result.link.includes(domain)) + 1;
        
        console.log(`OK: '${keyword}' için sıra bulundu: ${rank > 0 ? rank : 'Bulunamadı'}`);
        return rank > 0 ? rank : null;
    } catch (error: any) {
        console.error(`--- getRankForKeyword: HATA ('${keyword}') ---`);
        console.error("Hata Mesajı:", error.message);
        console.error("SERP API'den gelen yanıt:", error.response?.data);
        // Do not re-throw, just return null to allow other keywords to be processed
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
        console.log(`OK: ${usersSnapshot.docs.length} kullanıcı bulundu.`);

        for (const userDoc of usersSnapshot.docs) {
            console.log(`--- Kullanıcı işleniyor: ${userDoc.id} ---`);
            
            console.log(`Adım 2: '${userDoc.id}' kullanıcısının projeleri getiriliyor...`);
            const projectsSnapshot = await userDoc.ref.collection('projects').get();
            console.log(`OK: ${projectsSnapshot.docs.length} proje bulundu.`);

            for (const projectDoc of projectsSnapshot.docs) {
                const projectData = projectDoc.data();
                console.log(`--- Proje işleniyor: ${projectDoc.id} (${projectData.name}) ---`);

                console.log(`Adım 3: '${projectDoc.id}' projesinin anahtar kelimeleri getiriliyor...`);
                const keywordsSnapshot = await projectDoc.ref.collection('keywords').get();
                console.log(`OK: ${keywordsSnapshot.docs.length} anahtar kelime bulundu.`);

                for (const keywordDoc of keywordsSnapshot.docs) {
                    const keywordData = keywordDoc.data();
                    console.log(`--- Anahtar kelime taranıyor: ${keywordDoc.id} (${keywordData.name}) ---`);

                    const rank = await getRankForKeyword(keywordData.name, projectData.domain, keywordData.country);
                    
                    const newHistoryRecord = {
                        date: admin.firestore.Timestamp.now(),
                        rank: rank,
                    };

                    console.log(`Adım 4: '${keywordDoc.id}' için yeni sıralama verisi kaydediliyor...`);
                    await keywordDoc.ref.update({
                        history: admin.firestore.FieldValue.arrayUnion(newHistoryRecord)
                    });
                    console.log("OK: Sıralama verisi başarıyla kaydedildi.");

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
        console.error("Hata Türü:", error.constructor.name);
        console.error("Hata Mesajı:", error.message);
        console.error("Hata Yığını:", error.stack);
        const errorMessage = `Tarama işlemi sırasında bir hata oluştu: ${error.message}`;
        return { success: false, message: errorMessage, error: errorMessage };
    } finally {
        console.log("--- runScanAction: Tamamlandı ---");
    }
}
