import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

async function sendText(to, body) {
  try {
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
          type: "text",
          text: { body },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    console.log("✅ Mensaje de texto enviado");
  } catch (err) {
    console.error("❌ Error al enviar mensaje de texto:", err);
  }
}

async function upsertMessage({ phone, name, trackingId, order, message }) {
  const chatRef = doc(db, "whatsapp_chats", phone);
  const chatSnap = await getDoc(chatRef);
  const timestamp = new Date();
  const nuevoMensaje = { ...message, timestamp, read: false };

  let orders = chatSnap.exists() ? chatSnap.data().orders || [] : [];

  let index = orders.findIndex((o) => o.trackingId === trackingId);

  if (index !== -1) {
    orders[index].messages.push(nuevoMensaje);
  } else {
    orders.push({
      trackingId,
      orderId: trackingId,
      createdAt: timestamp,
      status: "pending",
      orderMode: order?.delivery === false ? "takeaway" : "delivery",
      messages: [nuevoMensaje],
    });
  }

  await setDoc(
    chatRef,
    {
      phone,
      name,
      updatedAt: serverTimestamp(),
      orders,
    },
    { merge: true }
  );

  try {
    await fetch(
      "https://mordisco-ws-production.up.railway.app/notify-whatsapp",
      {
        method: "POST",
      }
    );
    console.log("📣 Notificación WebSocket enviada");
  } catch (e) {
    console.error("⚠️ Error notificando WebSocket:", e.message);
  }
}

export async function POST(req) {
  const body = await req.json();
  const change = body.entry?.[0]?.changes?.[0]?.value;
  const message = change?.messages?.[0];
  const type = message?.type;
  const phone = message?.from;



  // 🕒 Verificación de horario
const now = new Date();
// const hora = now.getHours();
const hora = Number(
  new Intl.DateTimeFormat("es-AR", {
    hour: "numeric",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date())
);


if (hora >= 16 && hora < 18) {
  const phoneNormalized = phone.replace(/\D/g, "");

  // Enviar mensaje automático de fuera de horario
  await sendText(
    phoneNormalized,
    "Hola, en este momento estamos cerrados, pero por cualquier consulta o reclamo podés escribirnos acá:"
  );

  // Enviar contacto de reclamos
  await fetch(
    `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNormalized,
        type: "contacts",
        contacts: [
          {
            name: {
              formatted_name: "Mordisco Reclamos",
              first_name: "Reclamos",
              last_name: "Mordisco",
            },
            phones: [
              {
                phone: "5493794054555", // <-- cambiá este número si querés otro
                type: "CELL",
                wa_id: "5493794054555",
              },
            ],
            org: {
              company: "Mordisco",
            },
          },
        ],
      }),
    }
  );

  return new Response("Mensaje automático fuera de horario", { status: 200 });
}




  if (!message || !type || !phone)
    return new Response("Sin mensaje válido", { status: 200 });

  if (type === "button") {
    const originalMessageId = message.context?.id;
    const phoneNormalized = phone.replace(/\D/g, "");

    if (!originalMessageId || !phoneNormalized)
      return new Response("Faltan datos", { status: 200 });

    const chatRef = doc(db, "whatsapp_chats", phoneNormalized);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists())
      return new Response("Chat no encontrado", { status: 200 });

    const { name: customerName = "cliente", orders = [] } = chatSnap.data();
    let trackingId = null;
    let matchedOrder = null;

    for (const order of orders) {
      if (order.messages?.some((m) => m.messageId === originalMessageId)) {
        trackingId = order.trackingId;
        matchedOrder = order;
        break;
      }
    }

    if (!trackingId) return new Response("No matching order", { status: 200 });

    const q = query(
      collection(db, "orders"),
      where("trackingId", "==", trackingId)
    );
    const snap = await getDocs(q);
    if (snap.empty)
      return new Response("Pedido no encontrado", { status: 200 });

    const orderDoc = snap.docs[0];
    const order = orderDoc.data();
    const orderRef = orderDoc.ref;

    const baseMessage = { direction: "incoming", tipo: "texto", message: "" };
    const payload = message.button?.payload?.toLowerCase() || "";

    if (payload.includes("confirmar")) {
      if (order.status === "cancelled") {
        baseMessage.message = "⚠️ Intentó confirmar un pedido cancelado.";
        await sendText(phoneNormalized, "⚠️ El pedido ya fue cancelado.");
      } else if (order.clientConfirm === true) {
        baseMessage.message = "⚠️ Pedido ya confirmado.";
        await sendText(phoneNormalized, "⚠️ Ya confirmaste tu pedido.");
      } else {
        await updateDoc(orderRef, {
          clientConfirm: true,
          clientConfirmAt: serverTimestamp(),
        });
        baseMessage.message = "✅ Pedido confirmado por el cliente.";

        const mensajeFinal =
          order.delivery === false
            ? "✅ Pedido confirmado. Te avisaremos por acá cuando esté listo para retirarlo. ¡Gracias!"
            : "✅ Pedido confirmado. Te avisaremos por acá cuando esté yendo el repartidor. ¡Gracias!";

        // await sendText(phoneNormalized, mensajeFinal);
        await sendText(phoneNormalized, mensajeFinal);

        if (order.paymentMethodId === "transfer") {
          await sendText(phoneNormalized, "ALIAS: 👇👇👇");
          await sendText(phoneNormalized, "MORDISCOBURGERS");
        }
      }
    }

    if (payload.includes("cancelar")) {
      if (order.clientConfirm === true) {
        baseMessage.message = "⚠️ Intentó cancelar un pedido confirmado.";
        await sendText(
          phoneNormalized,
          "⚠️ Ya confirmaste tu pedido, no se puede cancelar."
        );
      } else if (order.status === "cancelled") {
        baseMessage.message = "⚠️ Pedido ya cancelado.";
        await sendText(
          phoneNormalized,
          "⚠️ Ya cancelamos tu pedido anteriormente."
        );
      } else {
        await updateDoc(orderRef, {
          clientConfirm: false,
          clientCancelAt: serverTimestamp(),
          status: "cancelled",
        });
        baseMessage.message = "❌ Pedido cancelado por el cliente.";
        await sendText(
          phoneNormalized,
          "❌ Pedido cancelado. Podés hacer otro desde la web."
        );
      }
    }

    async function sendContact(to) {
      try {
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
              type: "contacts",
              contacts: [
                {
                  name: {
                    formatted_name: "Mordisco Atención",
                    first_name: "Atención",
                    last_name: "Mordisco",
                  },
                  phones: [
                    {
                      phone: "5493794054555",
                      type: "CELL",
                      wa_id: "5493794054555",
                    },
                  ],
                  org: {
                    company: "Mordisco",
                  },
                },
              ],
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(data));
        console.log("✅ Contacto enviado correctamente");
      } catch (err) {
        console.error("❌ Error al enviar contacto:", err);
      }
    }

    await upsertMessage({
      phone: phoneNormalized,
      name: customerName,
      trackingId,
      order,
      message: baseMessage,
    });

    return new Response("Botón procesado", { status: 200 });
  }

  if (type === "text") {
    const phoneNormalized = phone.replace(/\D/g, "");
    const q = query(
      collection(db, "orders"),
      where("customer.phone", "==", phoneNormalized),
      where("status", "!=", "delivered")
    );
    const snap = await getDocs(q);

    let order = null;
    let trackingId = `tracking_unknown_${phoneNormalized}_${Date.now()}`;
    let customerName = null;

    if (!snap.empty) {
      const doc = snap.docs[0];
      order = doc.data();
      trackingId = order.trackingId;
      customerName = order.customer?.name || null;
    }

    const incomingMessage = {
      direction: "incoming",
      tipo: "texto",
      message: message.text?.body || "",
    };

    await upsertMessage({
      phone: phoneNormalized,
      name: customerName,
      trackingId,
      order,
      message: incomingMessage,
    });
  }

  if (type === "sticker") {
    // const phoneNormalized = phone.replace(/\D/g, "");
    const phoneNormalized = typeof phone === "string" ? phone.replace(/\D/g, "") : null;

if (!phoneNormalized) {
  console.warn("📵 Webhook recibido sin número de teléfono válido");
  return new Response("Sin teléfono válido", { status: 200 });
}

    const mediaId = message.sticker?.id;
    console.log("📎 Sticker media_id recibido:", mediaId);
    const mimeType = message.sticker?.mime_type || "image/webp";

    if (!mediaId) return new Response("Sin media ID", { status: 200 });

    try {
      const resUrl = await fetch(
        `https://graph.facebook.com/v19.0/${mediaId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          },
        }
      );
      const mediaMeta = await resUrl.json();
      const mediaUrl = mediaMeta.url;

      const resImage = await fetch(mediaUrl, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        },
      });
      const buffer = await resImage.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const q = query(
        collection(db, "orders"),
        where("customer.phone", "==", phoneNormalized),
        where("status", "!=", "delivered")
      );
      const snap = await getDocs(q);

      let order = null;
      let trackingId = `tracking_unknown_${phoneNormalized}_${Date.now()}`;
      let customerName = null;

      if (!snap.empty) {
        const doc = snap.docs[0];
        order = doc.data();
        trackingId = order.trackingId;
        customerName = order.customer?.name || null;
      }

      const incomingMessage = {
        direction: "incoming",
        tipo: "sticker",
        message: `data:${mimeType};base64,${base64}`,
      };

      await upsertMessage({
        phone: phoneNormalized,
        name: customerName,
        trackingId,
        order,
        message: incomingMessage,
      });

      return new Response("Sticker recibido", { status: 200 });
    } catch (err) {
      console.error("❌ Error procesando sticker:", err);
      return new Response("Error sticker", { status: 500 });
    }
  }

  if (type === "location") {
    const phoneNormalized = phone.replace(/\D/g, "");
    const { latitude, longitude, name, address } = message.location || {};

    const q = query(
      collection(db, "orders"),
      where("customer.phone", "==", phoneNormalized),
      where("status", "!=", "delivered")
    );
    const snap = await getDocs(q);

    let order = null;
    let trackingId = `tracking_unknown_${phoneNormalized}_${Date.now()}`;
    let customerName = null;

    if (!snap.empty) {
      const doc = snap.docs[0];
      order = doc.data();
      trackingId = order.trackingId;
      customerName = order.customer?.name || null;
    }

    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    const incomingMessage = {
      direction: "incoming",
      tipo: "ubicacion",
      message: locationUrl,
      lat: latitude,
      lng: longitude,
      name,
      address,
    };

    await upsertMessage({
      phone: phoneNormalized,
      name: customerName,
      trackingId,
      order,
      message: incomingMessage,
    });

    return new Response("Ubicación recibida", { status: 200 });
  }

  if (type === "image") {
    const phoneNormalized = phone.replace(/\D/g, "");
    const mediaId = message.image?.id;
    const mimeType = message.image?.mime_type || "image/jpeg";

    if (!mediaId) return new Response("Sin media ID", { status: 200 });

    try {
      // Paso 1: Obtener la URL de descarga de la imagen
      const resUrl = await fetch(
        `https://graph.facebook.com/v19.0/${mediaId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          },
        }
      );
      const mediaMeta = await resUrl.json();
      const mediaUrl = mediaMeta.url;

      if (!mediaUrl) throw new Error("No se pudo obtener la URL de la imagen");

      // Paso 2: Descargar la imagen (como blob o base64 si querés guardarla)
      const resImage = await fetch(mediaUrl, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        },
      });
      const imageBuffer = await resImage.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString("base64");

      // Paso 3: Guardar el mensaje con la imagen
      const q = query(
        collection(db, "orders"),
        where("customer.phone", "==", phoneNormalized),
        where("status", "!=", "delivered")
      );
      const snap = await getDocs(q);

      let order = null;
      let trackingId = `tracking_unknown_${phoneNormalized}_${Date.now()}`;
      let customerName = null;

      if (!snap.empty) {
        const doc = snap.docs[0];
        order = doc.data();
        trackingId = order.trackingId;
        customerName = order.customer?.name || null;
      }

      const incomingMessage = {
        direction: "incoming",
        tipo: "imagen",
        message: `data:${mimeType};base64,${base64Image}`, // para mostrar como imagen en <img src=... />
      };

      await upsertMessage({
        phone: phoneNormalized,
        name: customerName,
        trackingId,
        order,
        message: incomingMessage,
      });

      return new Response("Imagen recibida", { status: 200 });
    } catch (err) {
      console.error("❌ Error procesando imagen:", err);
      return new Response("Error imagen", { status: 500 });
    }
  }

  if (type === "document") {
    const phoneNormalized = phone.replace(/\D/g, "");
    const mediaId = message.document?.id;
    const mimeType = message.document?.mime_type || "application/pdf";
    const filename = message.document?.filename || "archivo.pdf";

    if (!mediaId) return new Response("Sin media ID", { status: 200 });

    try {
      // 1. Obtener URL de descarga del documento
      const resUrl = await fetch(
        `https://graph.facebook.com/v19.0/${mediaId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          },
        }
      );
      const mediaMeta = await resUrl.json();
      const mediaUrl = mediaMeta.url;

      if (!mediaUrl) throw new Error("No se pudo obtener la URL del documento");

      // 2. Descargar el documento (como base64 o guardás el link)
      const resFile = await fetch(mediaUrl, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        },
      });
      const fileBuffer = await resFile.arrayBuffer();
      const base64File = Buffer.from(fileBuffer).toString("base64");

      // 3. Buscar orden activa
      const q = query(
        collection(db, "orders"),
        where("customer.phone", "==", phoneNormalized),
        where("status", "!=", "delivered")
      );
      const snap = await getDocs(q);

      let order = null;
      let trackingId = `tracking_unknown_${phoneNormalized}_${Date.now()}`;
      let customerName = null;

      if (!snap.empty) {
        const doc = snap.docs[0];
        order = doc.data();
        trackingId = order.trackingId;
        customerName = order.customer?.name || null;
      }

      // 4. Guardar mensaje como tipo "documento"
      const incomingMessage = {
        direction: "incoming",
        tipo: "documento",
        filename,
        mimeType,
        message: `data:${mimeType};base64,${base64File}`,
      };

      await upsertMessage({
        phone: phoneNormalized,
        name: customerName,
        trackingId,
        order,
        message: incomingMessage,
      });

      return new Response("Documento recibido", { status: 200 });
    } catch (err) {
      console.error("❌ Error procesando documento:", err);
      return new Response("Error documento", { status: 500 });
    }
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
