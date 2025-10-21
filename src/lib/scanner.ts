// This is a simulation of a weekly scanner service.
// In a real-world application, this would be a cron job running on a server.

import { getKeywordsForProject, getProjects } from "./data";

const NOTIFICATION_EMAIL = "admin@ranktracker.pro";

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

  // Simulate a random failure (e.g., API is down, database connection lost)
  // Fails approximately 30% of the time.
  if (Math.random() < 0.3) {
    const errorMessage = "Simulated network error: Failed to connect to scanning service.";
    console.error(`SCAN FAILED: ${errorMessage}`);
    
    // Send an email notification about the failure
    sendEmailNotification(
      "CRITICAL: Weekly Keyword Scan Failed",
      `The weekly keyword rank scanning process failed to start.\n\nError: ${errorMessage}\n\nPlease check the system logs immediately.`
    );
    
    return { success: false, scannedCount: 0, error: errorMessage };
  }

  try {
    const allProjects = await getProjects();
    let totalKeywordsScanned = 0;

    for (const project of allProjects) {
      const keywords = await getKeywordsForProject(project.id);
      
      // Simulate scanning each keyword
      for (const keyword of keywords) {
        // In a real app, you would make an API call here to get the new rank.
        // We'll just log it for simulation.
        console.log(`  - Scanning: "${keyword.name}" for project "${project.name}"...`);
        await new Promise(resolve => setTimeout(resolve, 20)); // Simulate network delay for each keyword
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
