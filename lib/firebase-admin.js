// import admin from "firebase-admin";
// import { getStorage } from "firebase-admin/storage";

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.applicationDefault(), // o admin.credential.cert(...)
//     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   });
// }

// export const bucket = getStorage().bucket();

// @/lib/firebase-admin.js
import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // ej: deliveryapp-32ed7.appspot.com
  });
}

export const bucket = getStorage().bucket();
