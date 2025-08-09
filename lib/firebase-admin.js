import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // o admin.credential.cert(...)
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const bucket = getStorage().bucket();
