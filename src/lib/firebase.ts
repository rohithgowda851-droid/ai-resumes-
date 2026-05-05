import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

console.log("Initializing Firestore with Database ID:", firebaseConfig.firestoreDatabaseId);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Validate connection
async function testConnection() {
  try {
    console.log("Testing Firestore connection to /test/connection...");
    // Use a very simple get call
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
    console.log("Firestore connection successful.");
  } catch (error: any) {
    console.error("Firestore connection error:", {
      code: error.code,
      message: error.message,
      databaseId: firebaseConfig.firestoreDatabaseId,
      projectId: firebaseConfig.projectId
    });
  }
}
testConnection();
