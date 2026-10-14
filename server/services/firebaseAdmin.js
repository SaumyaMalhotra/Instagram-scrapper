import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAppCheck } from 'firebase-admin/app-check';
import { config } from '../config.js';

let app = null;
let db = null;
let auth = null;
let appCheck = null;

/**
 * Initializes Firebase Admin SDK.
 * Supports service account credentials via environment variables.
 * In development or emulator mode, falls back gracefully.
 */
function initFirebaseAdmin() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else if (config.firebaseProjectId && config.firebaseClientEmail && config.firebasePrivateKey) {
    try {
      app = initializeApp({
        credential: cert({
          projectId: config.firebaseProjectId,
          clientEmail: config.firebaseClientEmail,
          privateKey: config.firebasePrivateKey
        })
      });
      console.log('Firebase Admin SDK initialized successfully with service account.');
    } catch (err) {
      console.warn('Warning: Could not initialize Firebase Admin with service account:', err.message);
    }
  } else if (config.firebaseProjectId) {
    try {
      app = initializeApp({
        projectId: config.firebaseProjectId
      });
      console.log(`Firebase Admin SDK initialized for project ${config.firebaseProjectId}.`);
    } catch (err) {
      console.warn('Warning: Could not initialize Firebase Admin with project ID:', err.message);
    }
  }

  if (app) {
    try { db = getFirestore(app); } catch (e) { console.warn('Could not init Firestore:', e.message); }
    try { auth = getAuth(app); } catch (e) { console.warn('Could not init Auth:', e.message); }
    try { appCheck = getAppCheck(app); } catch (e) { console.warn('Could not init AppCheck:', e.message); }
  }

  return { app, db, auth, appCheck };
}

export const { app: adminApp, db: adminDb, auth: adminAuth, appCheck: adminAppCheck } = initFirebaseAdmin();
