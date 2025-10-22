
// This is a simulation of a weekly scanner service.
// In a real-world application, this would be a cron job running on a server.
// NOTE: This file uses client-side data fetching for simulation in this context.
// A real cron job would use firebase-admin.

import { getKeywordsForProject, getProjects } from "./data";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "@/firebase/config";


const DUMMY_USER_ID_FOR_SCAN = "demo-user-for-scan"; 
const NOTIFICATION_EMAIL = "admin@ranktracker.pro";


// Initialize a separate Firebase app instance for the scanner simulation
const scannerApp = initializeApp(firebaseConfig, "scannerApp");
const scannerDb = getFirestore(scannerApp);


/**
 * Simulates sending an email notification.
 * @param subject - The subject of the email.
 * @param body - The body content of the email.
 */
function sendEmailNotification(subject: string, body: string) {
  console.error("--- EMAIL NOTIFICATION ---");
  console.log(`TO: ${NOTIFICATION_EMAIL}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY: \n${body}`);
  console.error("--------------------------");
}

/**
 * Simulates running a weekly scan for all keywords in all projects.
 * This function is designed to fail intermittently for testing purposes.
 */
export async function runWeeklyScan(): Promise<{ success: boolean; scannedCount: number; error?: string }> {
  console.log("Starting weekly scan simulation...");

  if (Math.random() < 0.3) {
    const errorMessage = "Simulated network error: Failed to connect to scanning service.";
    console.error(`SCAN FAILED: ${errorMessage}`);
    
    sendEmailNotification(
      "CRITICAL: Weekly Keyword Scan Failed",
      `The weekly keyword rank scanning process failed to start.\n\nError: ${errorMessage}\n\nPlease check the system logs immediately.`
    );
    
    return { success: false, scannedCount: 0, error: errorMessage };
  }

  try {
    // In a real app, you'd get all users from the admin SDK. Here we use a dummy ID.
    // This requires a 'users/demo-user-for-scan' document to exist in Firestore.
    const allProjects = await getProjects(scannerDb, DUMMY_USER_ID_FOR_SCAN);
    let totalKeywordsScanned = 0;

    for (const project of allProjects) {
      const keywords = await getKeywordsForProject(scannerDb, DUMMY_USER_ID_FOR_SCAN, project.id);
      
      for (const keyword of keywords) {
        console.log(`  - Scanning: "${keyword.name}" for project "${project.name}"...`);
        await new Promise(resolve => setTimeout(resolve, 20)); // Simulate network delay
        totalKeywordsScanned++;
      }
    }
    
    console.log(`Weekly scan finished successfully. Scanned ${totalKeywordsScanned} keywords.`);
    return { success: true, scannedCount: totalKeywordsScanned };

  } catch (e: any) {
    const errorMessage = e.message || "An unknown error occurred during the scan.";
    console.error(`SCAN FAILED: ${errorMessage}`);
    
    sendEmailNotification(
      "CRITICAL: Weekly Keyword Scan Failed",
      `The weekly keyword rank scanning process failed unexpectedly.\n\nError: ${errorMessage}\n\nPlease check the system logs.`
    );
    
    return { success: false, scannedCount: 0, error: errorMessage };
  }
}
