import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';


// Read config from env (production) and decide availability
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Enable Firebase when minimum config is present (works on GH Pages too)
export const isFirebaseAvailable: boolean = !!firebaseConfig.projectId && !!firebaseConfig.databaseURL;

let app: FirebaseApp | null = null;
let database: Database | null = null;

if (isFirebaseAvailable) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  } catch (err) {
    // If initialization fails for any reason, keep the app functional without Firebase
    // eslint-disable-next-line no-console
    console.error('[Firebase] Initialization failed; continuing without Firebase:', err);
    app = null;
    database = null;
  }
} else {
  // eslint-disable-next-line no-console
  console.info('[Firebase] Disabled in this environment. Running without realtime features.');
}

export { database };
