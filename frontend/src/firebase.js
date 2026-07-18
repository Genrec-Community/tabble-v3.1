import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAaoWbLGuXvejAMXAM7Zy3ITjplxdW6Y3w",
  authDomain: "tabble-v4.firebaseapp.com",
  projectId: "tabble-v4",
  storageBucket: "tabble-v4.firebasestorage.app",
  messagingSenderId: "903795298048",
  appId: "1:903795298048:web:d1403c9c4f3d3617692de5",
  measurementId: "G-GS2V65DDX0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Keep auth alive across browser sessions for customer + chef
setPersistence(auth, browserLocalPersistence).catch(console.error);
