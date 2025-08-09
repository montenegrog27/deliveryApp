import { bucket } from "@/lib/firebase-admin";

export async function POST(req) {
  try {
    const { storagePath } = await req.json();
    if (!storagePath) return new Response("Missing storagePath", { status: 400 });

    const file = bucket.file(storagePath);
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 días
    const [signedUrl] = await file.getSignedUrl({ action: "read", expires: expiresAt });

    return new Response(JSON.stringify({ signedUrl, urlExpiresAt: expiresAt }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("refresh-whatsapp-url error:", e);
    return new Response("Error", { status: 500 });
  }
}
