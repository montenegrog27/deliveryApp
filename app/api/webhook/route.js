export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  } else {
    return new Response("Unauthorized", { status: 403 });
  }
}

export async function POST(req) {
  const body = await req.json();
  console.log("📩 Webhook recibido:", JSON.stringify(body, null, 2));

  try {
    const change = body.entry?.[0]?.changes?.[0]?.value;

    const message = change?.messages?.[0];
    const type = message?.type;
    const phone = message?.from;

    if (type === "button") {
      const payload = message?.button?.payload;
      console.log(`👉 El cliente ${phone} respondió al botón: ${payload}`);

      // Acá podés guardar en Firestore según el payload
      // Ejemplo:
      // if (payload === "confirmar") { ... }
      // if (payload === "cancelar") { ... }
    }
  } catch (err) {
    console.error("❌ Error procesando webhook:", err);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
