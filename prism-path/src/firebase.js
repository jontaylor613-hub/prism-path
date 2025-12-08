// Firebase Configuration and FERPA-Compliant Setup
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase config - Replace with your actual config from Firebase Console
// Get this from: Firebase Console → Project Settings → General → Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Validate Firebase configuration
const isConfigValid = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const placeholderValues = ['your-api-key', 'your-project.firebaseapp.com', 'your-project-id', 'your-project.appspot.com', '123456789', 'your-app-id'];
  
  for (const field of requiredFields) {
    const value = firebaseConfig[field];
    if (!value || placeholderValues.includes(value)) {
      console.error(`Firebase configuration error: ${field} is missing or using placeholder value`);
      return false;
    }
  }
  return true;
};

// Check if we're in development and should show config errors
if (import.meta.env.DEV && !isConfigValid()) {
  console.warn('⚠️ Firebase configuration appears incomplete. Please check your environment variables.');
  console.warn('Required variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID');
}

// Initialize Firebase
let app;
try {
  // Check if Firebase app already exists
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw new Error(`Firebase initialization failed: ${error.message}. Please check your Firebase configuration.`);
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;

