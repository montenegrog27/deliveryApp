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
  const app = admin.initializeApp({
    credential: admin.credential.applicationDefault(), // o cert(...)
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // ej: mordisco-app.appspot.com
  });
  console.log("Admin init:", {
    projectId: app.options?.credential?.projectId,
    storageBucket: app.options?.storageBucket,
  });
}

export const bucket = getStorage().bucket();
console.log("Resolved bucket name:", bucket.name);
