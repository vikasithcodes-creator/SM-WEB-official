import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

// SM_LOCAL_ONLY=1 runs the server on the local JSON files only, with no Firebase
// connection — for local development without Google credentials (and without
// touching live production orders).
if (process.env.SM_LOCAL_ONLY === '1') {
  console.log('SM_LOCAL_ONLY=1: Firebase Admin disabled, using local JSON data only');
} else try {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    adminApp = getApps()[0];
  }

  // Use the firestoreDatabaseId if provisioned
  adminDb = firebaseConfig.firestoreDatabaseId
    ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
    : getFirestore(adminApp);
  adminAuth = getAuth(adminApp);
  console.log('Firebase Admin SDK initialized successfully for project:', firebaseConfig.projectId);
} catch (err) {
  console.warn('Firebase Admin SDK initialization note:', err);
}

export { adminApp, adminDb, adminAuth };
