// lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";

// Config de Firebase (usa variables de entorno como ya hacías)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Inicializo Firestore y Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Fijo sessionStorage como persistencia
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.error("No se pudo fijar session persistence:", err);
});

// ------------------------------
// FUNCIONES NUEVAS
// ------------------------------

// 🟡 Configuración de envío desde settings/delivery
export async function getDeliveryConfig() {
  const ref = doc(db, "settings", "delivery");
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Configuración de delivery no encontrada");
  return snap.data();
}

// 🟢 Sucursales desde settings/branches
export async function getBranches() {
  const ref = doc(db, "settings", "branches");
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Sucursales no encontradas");
  return snap.data().branches || [];
}

// ------------------------------
// EXISTENTE - para guardar zonas
// ------------------------------
export async function saveZone(zone) {
  const ref = collection(db, "zones");
  await addDoc(ref, zone);
}
