import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyB7rrIYPT3VA8cnbu8Ayv1usqusC93baho',
  authDomain: 'follow-up-log.firebaseapp.com',
  projectId: 'follow-up-log',
  storageBucket: 'follow-up-log.appspot.com',
  messagingSenderId: '1097871891961',
  appId: '1:1097871891961:web:f733e8b0b5550da644c9b3',
  measurementId: 'G-7XW5VMT5H8'
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider, app };
