import admin from 'firebase-admin';
import logger from '../utils/logger';

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase() {
  if (firebaseInitialized) {
    return admin.app();
  }

  try {
    // Check if service account key is provided
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (serviceAccountPath) {
      // Initialize with service account file
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Initialize with individual credentials
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    } else {
      logger.warn('Firebase credentials not configured - running without persistence');
      return null;
    }

    firebaseInitialized = true;
    logger.info('✅ Firebase initialized successfully');
    return admin.app();
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
    return null;
  }
}

/**
 * Get Firestore instance
 */
export function getFirestore() {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  
  try {
    return admin.firestore();
  } catch (error) {
    logger.warn('Firestore not available - running without persistence');
    return null;
  }
}

/**
 * Check if Firebase is available
 */
export function isFirebaseAvailable(): boolean {
  return firebaseInitialized && admin.apps.length > 0;
}

export default admin;
