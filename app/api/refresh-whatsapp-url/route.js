import { bucket } from "@/lib/firebase-admin";

// dominios permitidos
const ALLOWED_ORIGINS = new Set([
  "https://admin-app-wheat.vercel.app",
  "http://localhost:3001", // opcional para desarrollo
]);

function corsHeaders(origin) {
  // si no coincide, no setea ACAO (el navegador bloqueará)
  return ALLOWED_ORIGINS.has(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
      }
    : { "Vary": "Origin" };
}

export async function OPTIONS(req) {
  const origin = req.headers.get("origin") || "";
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(req) {
  const origin = req.headers.get("origin") || "";

  try {
    const { storagePath } = await req.json();
    if (!storagePath) {
      return new Response("Missing storagePath", {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    const file = bucket.file(storagePath);

    // (opcional) debug rápido por si alguna vez da 404
    // const [exists] = await file.exists();
    // if (!exists) {
    //   return new Response("File not found", { status: 404, headers: corsHeaders(origin) });
    // }

    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 días
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: expiresAt,
    });

    return new Response(
      JSON.stringify({ signedUrl, urlExpiresAt: expiresAt }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      }
    );
  } catch (e) {
    console.error("refresh-whatsapp-url error:", e);
    return new Response("Error", {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
}
