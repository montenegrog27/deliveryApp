import { bucket } from "@/lib/firebase-admin";

export async function uploadAndSign({ buffer, mimeType, phoneNormalized, trackingId, mediaId }) {
  const ext = (mimeType.split("/")[1] || "bin").split(";")[0];
  const path = `whatsapp/${phoneNormalized}/${trackingId}/${mediaId}.${ext}`;
  const file = bucket.file(path);

  console.log("Using bucket:", bucket.name);
  console.log("Target path:", path);

  await file.save(buffer, {
    contentType: mimeType,
    resumable: false,
    public: false,
    metadata: { contentType: mimeType },
  });

  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`Storage: file not found after save. bucket=${bucket.name} path=${path}`);
  }

  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const [signedUrl] = await file.getSignedUrl({ action: "read", expires: expiresAt });

  return { signedUrl, path, expiresAt };
}
