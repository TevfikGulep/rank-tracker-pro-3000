
"use client"

// This is a simulation of a weekly scanner service.
// In a real-world application, this would be a cron job running on a server.
// NOTE: This file uses client-side data fetching for simulation in this context.
// A real cron job would use firebase-admin.

import { getKeywordsForProject, getProjects } from "./data";
import { type Firestore, doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";


const NOTIFICATION_EMAIL = "admin@ranktracker.pro";

/**
 * Simulates sending an email notification.
 * @param subject - The subject of the email.
 * @param body - The body content of the email.
 */
function sendEmailNotification(subject: string, body: string) {
  console.log("--- EMAIL NOTIFICATION ---");
  console.log(`TO: ${NOTIFICATION_EMAIL}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY: \n${body}`);
  console.log("--------------------------");
}

/**
 * Simulates running a weekly scan for all keywords in all projects for a given user.
 * This version now generates random rank data and updates Firestore.
 */
export async function runWeeklyScan(db: Firestore, userId: string): Promise<{ success: boolean; scannedCount: number; error?: string }> {
  console.log(`Starting weekly scan simulation for user: ${userId}...`);

  try {
    const allProjects = await getProjects(db, userId);
    let totalKeywordsScanned = 0;

    for (const project of allProjects) {
      const keywords = await getKeywordsForProject(db, userId, project.id);
      
      for (const keyword of keywords) {
        console.log(`  - Scanning: "${keyword.name}" for project "${project.name}"...`);
        
        // Simulate getting a rank. Generate a random number between 1 and 100.
        const newRank = Math.floor(Math.random() * 100) + 1;
        
        // Create the new history entry
        const newHistoryEntry = {
          date: Timestamp.fromDate(new Date()),
          rank: newRank,
        };

        // Get a reference to the keyword document
        const keywordRef = doc(db, 'users', userId, 'projects', project.id, 'keywords', keyword.id);

        // Atomically add the new history entry to the "history" array field.
        await updateDoc(keywordRef, {
            history: arrayUnion(newHistoryEntry)
        });

        console.log(`  - Updated "${keyword.name}" with new rank: ${newRank}`);

        totalKeywordsScanned++;
      }
    }
    
    console.log(`Weekly scan finished successfully. Scanned ${totalKeywordsScanned} keywords for user ${userId}.`);
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
