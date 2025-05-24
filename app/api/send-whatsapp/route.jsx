import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      phone,
      trackingId,
      customerName,
      branchName,
    } = body;

    if (!phone || !trackingId || !customerName || !branchName) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    const to = phone.replace(/\D/g, ""); // Limpiar caracteres no numéricos
    const trackingUrl = `https://mordisco.app/tracking/${trackingId}`;

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: "confirmacion_pedido",
            language: { code: "es_AR" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: customerName },
                  { type: "text", text: branchName },
                  { type: "text", text: trackingUrl },
                ],
              },
              {
                type: "button",
                sub_type: "quick_reply",
                index: "0",
                parameters: [
                  { type: "payload", payload: `confirmar:${trackingId}` },
                ],
              },
              {
                type: "button",
                sub_type: "quick_reply",
                index: "1",
                parameters: [
                  { type: "payload", payload: `cancelar:${trackingId}` },
                ],
              },
            ],
          },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Error al enviar WhatsApp:", data);
      return NextResponse.json(
        { error: "Error al enviar WhatsApp", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("❌ Error interno en send-whatsapp:", err);
    return NextResponse.json(
      { error: "Error interno", message: err.message },
      { status: 500 }
    );
  }
}
