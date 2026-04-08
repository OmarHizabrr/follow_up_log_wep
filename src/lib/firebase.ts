import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB7rrIYPT3VA8cnbu8Ayv1usqusC93baho',
  appId: '1:793007437856:web:70126d4940482f7b452445',
  messagingSenderId: '793007437856',
  projectId: 'follow-up-log',
  authDomain: 'follow-up-log.firebaseapp.com',
  storageBucket: 'follow-up-log.firebasestorage.app',
  measurementId: 'G-W38C30JQ9W',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
