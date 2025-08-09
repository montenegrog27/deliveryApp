// import admin from "firebase-admin";
// import { getStorage } from "firebase-admin/storage";

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.applicationDefault(), // o admin.credential.cert(...)
//     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   });
// }

// export const bucket = getStorage().bucket();

import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    // podés omitir storageBucket acá y setearlo explícito abajo
  });
}

export const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

// Logs de diagnóstico (podés dejarlos temporalmente)
console.log("Admin ready:", {
  projectId: process.env.FIREBASE_PROJECT_ID,
  envBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
console.log("Resolved bucket name:", bucket.name);
