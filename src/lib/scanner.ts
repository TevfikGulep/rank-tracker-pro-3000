
"use client"

import { getProjects, getKeywordsForProject } from "./data";
import { type Firestore, doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { getJson } from "serpapi";

const NOTIFICATION_EMAIL = "admin@ranktracker.pro";

function sendEmailNotification(subject: string, body: string) {
  console.log("--- EMAIL NOTIFICATION ---");
  console.log(`TO: ${NOTIFICATION_EMAIL}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY: \n${body}`);
  console.log("--------------------------");
}

async function getGoogleRank(apiKey: string, query: string, domain: string, country: string): Promise<number | null> {
  try {
    const response = await getJson({
      engine: "google",
      q: query,
      location: country,
      num: 100, // Check top 100 results
      api_key: apiKey,
    });

    const organicResults = response.organic_results;
    if (!organicResults) {
      return null;
    }

    const rank = organicResults.findIndex((result: any) => 
      result.link && result.link.includes(domain)
    );

    return rank !== -1 ? rank + 1 : null;
  } catch (error) {
    console.error(`SerpApi error for query "${query}":`, error);
    // Return null to indicate the check failed, but don't stop the whole scan
    return null;
  }
}

export async function runWeeklyScan(db: Firestore, userId: string, apiKey: string): Promise<{ success: boolean; scannedCount: number; error?: string }> {
  console.log(`Starting weekly scan for user: ${userId}...`);

  if (!apiKey) {
    const message = "SerpApi API key is not configured.";
    console.error(`SCAN FAILED: ${message}`);
    sendEmailNotification("CRITICAL: Weekly Keyword Scan Failed", `The scan failed for user ${userId} because the SerpApi API Key is missing.`);
    return { success: false, scannedCount: 0, error: message };
  }

  try {
    const allProjects = await getProjects(db, userId);
    let totalKeywordsScanned = 0;

    for (const project of allProjects) {
      const keywords = await getKeywordsForProject(db, userId, project.id);
      
      for (const keyword of keywords) {
        console.log(`  - Checking rank for: "${keyword.name}" in project "${project.name}"...`);
        
        const newRank = await getGoogleRank(apiKey, keyword.name, project.domain, keyword.country);
        
        const newHistoryEntry = {
          date: Timestamp.fromDate(new Date()),
          rank: newRank,
        };

        const keywordRef = doc(db, 'users', userId, 'projects', project.id, 'keywords', keyword.id);

        await updateDoc(keywordRef, {
            history: arrayUnion(newHistoryEntry)
        });

        console.log(`  - Updated "${keyword.name}" with new rank: ${newRank ?? "Not found"}`);
        totalKeywordsScanned++;
      }
    }
    
    console.log(`Weekly scan finished. Scanned ${totalKeywordsScanned} keywords for user ${userId}.`);
    return { success: true, scannedCount: totalKeywordsScanned };

  } catch (e: any) {
    const errorMessage = e.message || "An unknown error occurred during the scan.";
    console.error(`SCAN FAILED: ${errorMessage}`);
    
    sendEmailNotification(
      "CRITICAL: Weekly Keyword Scan Failed",
      `The weekly keyword rank scanning process failed unexpectedly for user ${userId}.\n\nError: ${errorMessage}\n\nPlease check the system logs.`
    );
    
    return { success: false, scannedCount: 0, error: errorMessage };
  }
}
