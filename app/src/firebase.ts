import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Fill these in from your Firebase project settings (see ../FIREBASE_SETUP.md).
// Vite exposes any VITE_-prefixed var from a .env file at build/dev time.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// getAuth() (unlike getFirestore/getStorage) validates the API key eagerly
// and throws synchronously — guard it so a missing/placeholder .env doesn't
// crash the whole app at import time. Every caller checks firebaseConfigured
// before actually using `auth`, so this placeholder is never invoked.
let authInstance: Auth;
try {
  authInstance = getAuth(app);
} catch (e) {
  console.warn('Firebase Auth not available (check VITE_FIREBASE_API_KEY).', e);
  authInstance = null as unknown as Auth;
}
export const auth = authInstance;

// A single shared admin account gates editing (see FIREBASE_SETUP.md step 6).
// Everyone else browses read-only with no sign-in — there's deliberately no
// per-person login, just one password that unlocks editing for the device
// that enters it.
export const ADMIN_EMAIL = 'admin@kpi.local';
