import { initializeApp } from 'firebase/app';

import {
  getAuth,
  GoogleAuthProvider
} from 'firebase/auth';

import {
  getFirestore
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Firestore database
export const db = getFirestore(app);

// ✅ Firebase authentication
export const auth = getAuth(app);

// ✅ Google login provider
export const provider = new GoogleAuthProvider();

// Optional debug logs
console.log("✅ Firebase initialized");
console.log("✅ Auth initialized");
console.log("✅ Firestore initialized");