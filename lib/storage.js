// lib/storage.js
import { bucket } from "./firebase-admin.js";

export async function uploadAndSign({
  buffer,
  mimeType,
  phoneNormalized,
  trackingId,
  mediaId,
}) {
  const ext = (mimeType.split("/")[1] || "bin").split(";")[0];
  const path = `whatsapp/${phoneNormalized}/${trackingId}/${mediaId}.${ext}`;
  const file = bucket.file(path);

  await file.save(buffer, {
    contentType: mimeType,
    resumable: false,
    public: false,
    metadata: { contentType: mimeType },
  });


  // después de await file.save(buffer, {...})
const [exists] = await file.exists();
if (!exists) {
  throw new Error(`Storage: file not found after save. bucket=${file.bucket.name} path=${file.name}`);
}

const [metadata] = await file.getMetadata();
console.log("Using bucket:", bucket.name);
console.log("Target path:", path);

console.log("✅ Storage saved:", {
  bucket: metadata.bucket,
  name: metadata.name,
  size: metadata.size,
  contentType: metadata.contentType,
});

const [signedUrl] = await file.getSignedUrl({
  action: "read",
  expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
});



  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 días

  return { signedUrl, path, expiresAt };
}
