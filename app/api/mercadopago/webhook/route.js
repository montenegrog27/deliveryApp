// app/api/mercadopago/webhook/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();

  const paymentId = body?.data?.id;
  const topic = body?.type;

  if (topic !== "payment") return NextResponse.json({ ok: true });

  try {
    // Obtener detalles del pago desde MercadoPago
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });

    const payment = await res.json();

    if (payment.status === "approved") {
      const externalRef = payment.external_reference;

      // ✅ Marcar la orden existente como pagada
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: externalRef }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
