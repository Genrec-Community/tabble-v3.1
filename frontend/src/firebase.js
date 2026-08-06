import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAaoWbLGuXvejAMXAM7Zy3ITjplxdW6Y3w",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "tabble-v4.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "tabble-v4",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "tabble-v4.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "903795298048",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:903795298048:web:d1403c9c4f3d3617692de5",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-GS2V65DDX0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Keep auth alive across browser sessions for customer + chef
setPersistence(auth, browserLocalPersistence).catch(console.error);
