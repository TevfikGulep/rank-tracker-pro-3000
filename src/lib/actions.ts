
'use server'

import * as admin from 'firebase-admin';
import { getJson } from "serpapi";
import * as path from 'path';
import * as fs from 'fs';

// Helper function to safely initialize Firebase Admin
function initializeFirebaseAdmin() {
  console.log("--- initializeFirebaseAdmin: Başlatılıyor ---");
  try {
    // If the app is already initialized, return the existing firestore instance.
    if (admin.apps.length > 0) {
      console.log("OK: Firebase Admin zaten başlatılmış.");
      return admin.firestore();
    }

    // --- YENİ YAKLAŞIM: service-account.json dosyasını kullanarak başlatma ---
    console.log("OK: 'service-account.json' dosyası aranıyor...");
    const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');

    if (!fs.existsSync(serviceAccountPath)) {
        console.error("--- initializeFirebaseAdmin: KRİTİK HATA ---");
        throw new Error("Sunucu yapılandırması eksik: 'service-account.json' dosyası bulunamadı.");
    }
    
    console.log("OK: 'service-account.json' dosyası bulundu. SDK başlatılıyor...");
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("OK: Firebase Admin, servis hesabı dosyasıyla başarıyla başlatıldı.");
    return admin.firestore();

  } catch (error: any) {
    console.error("--- initializeFirebaseAdmin: KRİTİK HATA ---");
    console.error("Hata Mesajı:", error.message);
    console.error("Hata Yığını:", error.stack);
    // Re-throw a more user-friendly error.
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
        if (usersSnapshot.empty) {
            console.log("UYARI: Hiç kullanıcı bulunamadı.");
        } else {
            console.log(`OK: ${usersSnapshot.docs.length} kullanıcı bulundu.`);
        }

        for (const userDoc of usersSnapshot.docs) {
            console.log(`--- Kullanıcı işleniyor: ${userDoc.id} ---`);
            
            console.log(`Adım 2: '${userDoc.id}' kullanıcısının projeleri getiriliyor...`);
            const projectsSnapshot = await userDoc.ref.collection('projects').get();
             if (projectsSnapshot.empty) {
                console.log("UYARI: Bu kullanıcı için hiç proje bulunamadı.");
                continue; // Skip to the next user
            }
            console.log(`OK: ${projectsSnapshot.docs.length} proje bulundu.`);

            for (const projectDoc of projectsSnapshot.docs) {
                const projectData = projectDoc.data();
                console.log(`--- Proje işleniyor: ${projectDoc.id} (${projectData.name}) ---`);

                console.log(`Adım 3: '${projectDoc.id}' projesinin anahtar kelimeleri getiriliyor...`);
                const keywordsSnapshot = await projectDoc.ref.collection('keywords').get();
                if (keywordsSnapshot.empty) {
                    console.log("UYARI: Bu proje için hiç anahtar kelime bulunamadı.");
                    continue; // Skip to the next project
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
