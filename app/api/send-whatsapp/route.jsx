import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      phone,
      trackingId: rawId,
      customerName,
      branchName,
      totalAmount,
    } = body;

    if (!phone || !rawId || !customerName || !branchName || !totalAmount) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    const to = phone.replace(/\D/g, "");
    console.log("to", to);
    const trackingId = rawId.startsWith("tracking_")
      ? rawId
      : `tracking_${rawId}`;
    const trackingUrl = `https://mordisco.app/tracking/${trackingId}`;

    const payload = {
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
              // { type: "text", text: totalAmount }, // ⬅️ nuevo
            ],
          },
        ],
      },
    };

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

    // 🔁 Guardar mensaje y pedido en whatsapp_chats/{phone}
    const chatRef = doc(db, "whatsapp_chats", to);
    const chatSnap = await getDoc(chatRef);
    const timestamp = new Date();

    const nuevoMensaje = {
      message: `Se envió mensaje de confirmación del pedido a ${customerName} desde sucursal ${branchName}.`,
      direction: "outgoing",
      tipo: "plantilla",
      timestamp,
    };

    let orders = [];

    if (chatSnap.exists()) {
      orders = chatSnap.data().orders || [];

      const index = orders.findIndex((o) => o.trackingId === trackingId);
      if (index !== -1) {
        orders[index].messages.push(nuevoMensaje);
      } else {
        orders.push({
          trackingId,
          orderId: trackingId,
          createdAt: timestamp,
          status: "pending",
          orderMode: "takeaway",
          messages: [nuevoMensaje],
        });
      }
    } else {
      orders.push({
        trackingId,
        orderId: trackingId,
        createdAt: timestamp,
        status: "pending",
        orderMode: "takeaway",
        messages: [nuevoMensaje],
      });
    }

    // 🧠 Si hay más de uno activo, enviar aclaración
    const activos = orders.filter((o) => o.status !== "delivered");
    if (activos.length > 1) {
      const aclaracion = activos
        .map((o) => {
          const hora = new Date(o.createdAt).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `#${o.orderId} (${o.orderMode} ${hora})`;
        })
        .join(" o ");

      orders[orders.length - 1].messages.push({
        message: `Hola! Tenés más de un pedido activo. ¿Te referís al pedido ${aclaracion}?`,
        direction: "outgoing",
        tipo: "plantilla",
        timestamp: new Date(),
      });
    }

    await setDoc(
      chatRef,
      {
        phone: to,
        name: customerName,
        updatedAt: serverTimestamp(),
        orders,
      },
      { merge: true }
    );

    // 🌐 WebSocket para notificar al inbox
    try {
      await fetch(
        "https://websocket-production-d210.up.railway.app/notify-whatsapp",
        {
          method: "POST",
        }
      );
    } catch (e) {
      console.error("⚠️ Error notificando al WebSocket");
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
