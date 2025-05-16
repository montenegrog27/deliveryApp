// lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


const app = initializeApp(firebaseConfig);

// Inicializo el auth
export const auth = getAuth(app);

// *** Aseguro desde el arranque que use sessionStorage ***
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.error("No se pudo fijar session persistence:", err);
});


export async function saveZone(zone) {
  const ref = collection(db, "zones");
  await addDoc(ref, zone);
}

// Exporto Firestore
export const db = getFirestore(app);

