import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// IMPORTANT: Replace this with your own Firebase project configuration.
// You can get this from the Firebase console.
const firebaseConfig = {
  "projectId": "connect-now-hjrsr",
  "appId": "1:411557401290:web:7efa5f82ff1fabc4459a33",
  "storageBucket": "connect-now-hjrsr.firebasestorage.app",
  "apiKey": "AIzaSyDjTtMDsFQDQb8dN5vPNpNPJflJdCjbg5g",
  "authDomain": "connect-now-hjrsr.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "411557401290"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
