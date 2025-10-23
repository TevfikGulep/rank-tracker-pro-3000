import * as admin from 'firebase-admin';

export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccount) {
    // This will be true in local development if the .env.local file is not configured.
    // In Firebase App Hosting, this variable is set automatically.
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set. This is required for server-side admin actions.');
  }

  const serviceAccountJson = JSON.parse(serviceAccount);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
    databaseURL: `https://${serviceAccountJson.project_id}.firebaseio.com`,
  });
}
