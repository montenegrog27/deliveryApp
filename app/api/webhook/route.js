// import { db } from "@/lib/firebase";
// import {
//   collection,
//   getDocs,
//   query,
//   updateDoc,
//   where,
//   serverTimestamp,
//   doc,
//   setDoc,
//   arrayUnion,
// } from "firebase/firestore";

// export async function POST(req) {
//   const body = await req.json();
//   const change = body.entry?.[0]?.changes?.[0]?.value;
//   const message = change?.messages?.[0];
//   const type = message?.type;
//   const phone = message?.from;

//   if (!message || !type || !phone) {
//     return new Response("Sin mensaje válido", { status: 200 });
//   }

//   // 📍 BOTONES (Confirmar o Cancelar)
//   if (type === "button") {
//     const payload = message?.button?.payload;
//     const [action, rawTrackingId] = payload.split(":");

//     if (!rawTrackingId) return new Response("No trackingId", { status: 200 });

//     const fullTrackingId = rawTrackingId.startsWith("tracking_")
//       ? rawTrackingId
//       : `tracking_${rawTrackingId}`;

//     const q = query(
//       collection(db, "orders"),
//       where("trackingId", "==", fullTrackingId)
//     );
//     const snap = await getDocs(q);

//     if (snap.empty) {
//       console.warn(
//         "⚠️ No se encontró la orden con trackingId:",
//         fullTrackingId
//       );
//       return new Response("Pedido no encontrado", { status: 200 });
//     }

//     const orderDoc = snap.docs[0];
//     const order = orderDoc.data();
//     const orderRef = orderDoc.ref;

//     const customerPhone = order.customer?.phone?.replace(/\D/g, "");
//     const customerName = order.customer?.name || "cliente";

//     // Confirmar
//     if (action === "confirmar") {
//       if (order.status === "cancelled") {
//         console.log("⚠️ Ya está cancelado, no se puede confirmar.");
//         await sendText(
//           customerPhone,
//           "⚠️ Lo sentimos, ya hemos cancelado tu pedido."
//         );
//         return new Response("Ya cancelado", { status: 200 });
//       }

//       if (order.clientConfirm === true) {
//         console.log("⚠️ Ya fue confirmado.");
//         await sendText(
//           customerPhone,
//           "⚠️ Ya hemos confirmado tu pedido anteriormente."
//         );
//         return new Response("Ya confirmado", { status: 200 });
//       }

//       await updateDoc(orderRef, {
//         clientConfirm: true,
//         clientConfirmAt: serverTimestamp(),
//       });
//       console.log("✅ Pedido confirmado por el cliente.");

//       await sendText(
//         customerPhone,
//         "✅ Pedido confirmado, muchas gracias por elegirnos!\nTe avisaremos cuando el cadete esté yendo, y también cuando esté fuera de tu domicilio.\n¡Gracias!"
//       );

//       return new Response("Confirmado", { status: 200 });
//     }

//     // Cancelar
//     if (action === "cancelar") {
//       if (order.clientConfirm === true) {
//         console.log("⚠️ Ya fue confirmado, no se puede cancelar.");
//         await sendText(
//           customerPhone,
//           "⚠️ No podemos cancelarlo, ya lo confirmaste."
//         );
//         return new Response("Ya confirmado", { status: 200 });
//       }

//       if (order.status === "cancelled") {
//         console.log("⚠️ Ya fue cancelado.");
//         await sendText(
//           customerPhone,
//           "⚠️ Ya cancelamos tu pedido anteriormente."
//         );
//         return new Response("Ya cancelado", { status: 200 });
//       }

//       await updateDoc(orderRef, {
//         clientConfirm: false,
//         clientCancelAt: serverTimestamp(),
//         status: "cancelled",
//       });
//       console.log("❌ Pedido cancelado por el cliente.");

//       await sendText(
//         customerPhone,
//         "❌ Orden cancelada. Muchas gracias por responder.\nSi fue un error, podés hacer un nuevo pedido desde https://mordiscoburgers.com.ar/pedidos"
//       );

//       return new Response("Cancelado", { status: 200 });
//     }
//   }

//   // 🟩 MENSAJE DE TEXTO NORMAL
//   if (type === "text") {
//     const q = query(
//       collection(db, "orders"),
//       where("customer.phone", "==", phone)
//     );
//     const snap = await getDocs(q);

//     const order = !snap.empty ? snap.docs[0].data() : null;
//     const trackingId = order?.trackingId || `chat_${phone}`;
//     const chatRef = doc(db, "whatsapp_chats", trackingId);

//     await setDoc(
//       chatRef,
//       {
//         orderNumber: order?.orderNumber || null,
//         phone,
//         name: order?.customer?.name || null,
//         trackingId: order?.trackingId || null,
//         updatedAt: serverTimestamp(),
//       },
//       { merge: true }
//     );

//     await updateDoc(chatRef, {
//       messages: arrayUnion({
//         message: message.text.body,
//         direction: "incoming",
//         tipo: "texto",
//         timestamp: new Date(),
//       }),
//       updatedAt: serverTimestamp(),
//     });

//     // 🔔 Notificar por WebSocket que hay un nuevo mensaje de WhatsApp
//     try {
//       await fetch(
//         "https://mordisco-ws-production.up.railway.app/notify-whatsapp",
//         {
//           method: "POST",
//         }
//       );
//       console.log("📣 Notificación enviada al WebSocket");
//     } catch (error) {
//       console.error("❌ Error notificando al WebSocket:", error);
//     }

//     console.log("📩 Mensaje guardado en whatsapp_chats:", trackingId);
//   }

//   return new Response("EVENT_RECEIVED", { status: 200 });
// }

// // Función auxiliar para enviar texto
// async function sendText(to, body) {
//   try {
//     const res = await fetch(
//       `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           messaging_product: "whatsapp",
//           to,
//           type: "text",
//           text: { body },
//         }),
//       }
//     );
//     const data = await res.json();
//     if (!res.ok) throw new Error(JSON.stringify(data));
//     console.log("✅ Mensaje de texto enviado");
//   } catch (err) {
//     console.error("❌ Error al enviar mensaje de texto:", err);
//   }
// }

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

// 🔧 Enviar mensaje de texto
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

// 🔁 Guardar mensaje en orders[]
async function upsertMessage({ phone, name, trackingId, order, message }) {
  const chatRef = doc(db, "whatsapp_chats", phone);
  const chatSnap = await getDoc(chatRef);
  const timestamp = new Date();
  // const nuevoMensaje = { ...message, timestamp };
const nuevoMensaje = { ...message, timestamp, read: false };

  let orders = [];

  if (chatSnap.exists()) {
    orders = chatSnap.data().orders || [];
  }

  let index = orders.findIndex((o) => o.trackingId === trackingId);

  if (index !== -1) {
    orders[index].messages.push(nuevoMensaje);
  } else {
    orders.push({
      trackingId,
      orderId: trackingId,
      createdAt: timestamp,
      status: order?.status || "pending",
      orderMode: order?.orderMode || "delivery",
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

  // WebSocket
  try {
    await fetch("https://mordisco-ws-production.up.railway.app/notify-whatsapp", {
      method: "POST",
    });
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

  if (!message || !type || !phone) {
    return new Response("Sin mensaje válido", { status: 200 });
  }

  // 📍 BOTONES (Confirmar / Cancelar)
  if (type === "button") {
    const payload = message.button?.payload;
    const [action, rawTrackingId] = payload?.split(":") || [];

    if (!rawTrackingId) return new Response("No trackingId", { status: 200 });

    const trackingId = rawTrackingId.startsWith("tracking_")
      ? rawTrackingId
      : `tracking_${rawTrackingId}`;

    const q = query(
      collection(db, "orders"),
      where("trackingId", "==", trackingId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn("⚠️ No se encontró la orden con trackingId:", trackingId);
      return new Response("Pedido no encontrado", { status: 200 });
    }

    const orderDoc = snap.docs[0];
    const order = orderDoc.data();
    const orderRef = orderDoc.ref;

    const customerPhone = order.customer?.phone?.replace(/\D/g, "");
    const customerName = order.customer?.name || "cliente";

    const baseMessage = {
      direction: "incoming",
      tipo: "texto",
      message: "",
    };

    if (action === "confirmar") {
      if (order.status === "cancelled") {
        baseMessage.message = "⚠️ Intentó confirmar un pedido ya cancelado.";
        await sendText(customerPhone, "⚠️ Lo sentimos, ya hemos cancelado tu pedido.");
      } else if (order.clientConfirm === true) {
        baseMessage.message = "⚠️ Intentó confirmar un pedido ya confirmado.";
        await sendText(customerPhone, "⚠️ Ya confirmaste tu pedido.");
      } else {
        await updateDoc(orderRef, {
          clientConfirm: true,
          clientConfirmAt: serverTimestamp(),
        });
        baseMessage.message = "✅ Pedido confirmado por el cliente.";
        await sendText(customerPhone, "✅ Pedido confirmado. ¡Gracias por elegirnos!");
      }
    }

    if (action === "cancelar") {
      if (order.clientConfirm === true) {
        baseMessage.message = "⚠️ Intentó cancelar un pedido ya confirmado.";
        await sendText(customerPhone, "⚠️ Ya confirmaste tu pedido, no se puede cancelar.");
      } else if (order.status === "cancelled") {
        baseMessage.message = "⚠️ Intentó cancelar un pedido ya cancelado.";
        await sendText(customerPhone, "⚠️ Ya cancelamos tu pedido anteriormente.");
      } else {
        await updateDoc(orderRef, {
          clientConfirm: false,
          clientCancelAt: serverTimestamp(),
          status: "cancelled",
        });
        baseMessage.message = "❌ Pedido cancelado por el cliente.";
        await sendText(customerPhone, "❌ Pedido cancelado. Podés hacer otro desde la web.");
      }
    }

    await upsertMessage({
      phone: customerPhone,
      name: customerName,
      trackingId,
      order,
      message: baseMessage,
    });

    return new Response("Botón procesado", { status: 200 });
  }

  // 🟩 MENSAJE DE TEXTO NORMAL
  // 🟩 MENSAJE DE TEXTO NORMAL
  if (type === "text") {
    const phoneNormalized = phone.replace(/\D/g, "");

    console.log("📩 Mensaje entrante de:", phone);
    console.log("📞 Número normalizado:", phoneNormalized);

    const q = query(
      collection(db, "orders"),
      where("customer.phone", "==", phoneNormalized),
      where("status", "!=", "delivered")
    );
    const snap = await getDocs(q);
    console.log("🔍 Órdenes encontradas:", snap.size);

    let order = null;
    let trackingId = `tracking_unknown_${phoneNormalized}_${Date.now()}`;
    let customerName = null;

    if (!snap.empty) {
      const doc = snap.docs[0];
      order = doc.data();
      trackingId = order.trackingId;
      customerName = order.customer?.name || null;
    } else {
      console.warn("⚠️ No se encontró una orden activa para este número:", phoneNormalized);
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


  return new Response("EVENT_RECEIVED", { status: 200 });
}
