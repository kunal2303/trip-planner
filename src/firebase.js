// Replace with your Firebase project config from Firebase Console
// https://console.firebase.google.com → Project settings → Your apps → SDK setup

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Surface missing env vars immediately in the UI
if (!firebaseConfig.apiKey) {
  document.body.innerHTML = '<div style="font-family:sans-serif;padding:2rem;color:red"><h2>Firebase config missing</h2><p>VITE_FIREBASE_* environment variables are not set in this deployment.</p></div>'
  throw new Error('Firebase env vars not set')
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
