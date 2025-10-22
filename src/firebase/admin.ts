import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccount) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
}

const serviceAccountJson = JSON.parse(serviceAccount);

export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
    databaseURL: `https://${serviceAccountJson.project_id}.firebaseio.com`,
  });
}
