
//FUNCIONA PERO NO SI HAY VARIOSPEDIDOS DE UN MISMO NUMERO, NO GUARDA MESSAGE ID

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
//   getDoc,
// } from "firebase/firestore";

// // 🔧 Enviar mensaje de texto
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

// // 🔁 Guardar mensaje en orders[]
// async function upsertMessage({ phone, name, trackingId, order, message }) {
//   console.log("💾 Guardando mensaje en whatsapp_chats");
//   console.log("🔁 TrackingId:", trackingId);
//   console.log("📱 Teléfono:", phone);
//   console.log("💬 Mensaje:", message.message);

//   const chatRef = doc(db, "whatsapp_chats", phone);
//   const chatSnap = await getDoc(chatRef);
//   const timestamp = new Date();
//   const nuevoMensaje = { ...message, timestamp, read: false };

//   let orders = [];

//   if (chatSnap.exists()) {
//     orders = chatSnap.data().orders || [];
//   }

//   let index = orders.findIndex((o) => o.trackingId === trackingId);

//   if (index !== -1) {
//     orders[index].messages.push(nuevoMensaje);
//   } else {
//     orders.push({
//       trackingId,
//       orderId: trackingId,
//       createdAt: timestamp,
//       status: "pending",
//       orderMode: order?.orderMode || "delivery",
//       messages: [nuevoMensaje],
//     });
//   }

//   await setDoc(
//     chatRef,
//     {
//       phone,
//       name,
//       updatedAt: serverTimestamp(),
//       orders,
//     },
//     { merge: true }
//   );

//   try {
//     await fetch("https://mordisco-ws-production.up.railway.app/notify-whatsapp", {
//       method: "POST",
//     });
//     console.log("📣 Notificación WebSocket enviada");
//   } catch (e) {
//     console.error("⚠️ Error notificando WebSocket:", e.message);
//   }
// }

// export async function POST(req) {
//   const body = await req.json();

//   console.log("📥 Webhook recibido");
//   console.log("🧾 Body:", JSON.stringify(body, null, 2));

//   const change = body.entry?.[0]?.changes?.[0]?.value;
//   const message = change?.messages?.[0];
//   const type = message?.type;
//   const phone = message?.from;

//   console.log("📨 Tipo de mensaje:", type);
//   console.log("📱 Teléfono del cliente:", phone);

//   if (!message || !type || !phone) {
//     return new Response("Sin mensaje válido", { status: 200 });
//   }

//   if (type === "button") {
//     console.log("🟡 Botón detectado");

//     const payload = message.button?.payload;
//     const [action, rawTrackingId] = payload?.split(":") || [];

//     console.log("🔘 Payload:", payload);
//     console.log("🧭 Acción:", action);
//     console.log("🆔 trackingId bruto:", rawTrackingId);

//     if (!rawTrackingId) return new Response("No trackingId", { status: 200 });

//     const trackingId = rawTrackingId.startsWith("tracking_")
//       ? rawTrackingId
//       : `tracking_${rawTrackingId}`;

//     console.log("🔗 trackingId normalizado:", trackingId);

//     const q = query(collection(db, "orders"), where("trackingId", "==", trackingId));
//     const snap = await getDocs(q);

//     console.log("📄 Documentos encontrados:", snap.size);

//     if (snap.empty) {
//       console.warn("⚠️ No se encontró la orden:", trackingId);
//       return new Response("Pedido no encontrado", { status: 200 });
//     }

//     const orderDoc = snap.docs[0];
//     const order = orderDoc.data();
//     const orderRef = orderDoc.ref;

//     const customerPhone = order.customer?.phone?.replace(/\D/g, "");
//     const customerName = order.customer?.name || "cliente";

//     const baseMessage = {
//       direction: "incoming",
//       tipo: "texto",
//       message: "",
//     };

//     console.log("📦 Estado actual:", order.status);
//     console.log("✅ Confirmación actual:", order.clientConfirm);

//     if (action === "confirmar") {
//       if (order.status === "cancelled") {
//         console.log("❗ Pedido ya cancelado");
//         baseMessage.message = "⚠️ Intentó confirmar un pedido ya cancelado.";
//         await sendText(customerPhone, "⚠️ Lo sentimos, ya hemos cancelado tu pedido.");
//       } else if (order.clientConfirm === true) {
//         console.log("❗ Ya estaba confirmado");
//         baseMessage.message = "⚠️ Intentó confirmar un pedido ya confirmado.";
//         await sendText(customerPhone, "⚠️ Ya confirmaste tu pedido.");
//       } else {
//         await updateDoc(orderRef, {
//           clientConfirm: true,
//           clientConfirmAt: serverTimestamp(),
//         });
//         console.log("✅ Confirmación guardada en Firestore");
//         baseMessage.message = "✅ Pedido confirmado por el cliente.";
//         await sendText(customerPhone, "✅ Pedido confirmado. ¡Gracias por elegirnos!");
//       }
//     }

//     if (action === "cancelar") {
//       if (order.clientConfirm === true) {
//         console.log("❗ No se puede cancelar, ya confirmado");
//         baseMessage.message = "⚠️ Intentó cancelar un pedido ya confirmado.";
//         await sendText(customerPhone, "⚠️ Ya confirmaste tu pedido, no se puede cancelar.");
//       } else if (order.status === "cancelled") {
//         console.log("❗ Ya estaba cancelado");
//         baseMessage.message = "⚠️ Intentó cancelar un pedido ya cancelado.";
//         await sendText(customerPhone, "⚠️ Ya cancelamos tu pedido anteriormente.");
//       } else {
//         await updateDoc(orderRef, {
//           clientConfirm: false,
//           clientCancelAt: serverTimestamp(),
//           status: "cancelled",
//         });
//         console.log("❌ Cancelación guardada en Firestore");
//         baseMessage.message = "❌ Pedido cancelado por el cliente.";
//         await sendText(customerPhone, "❌ Pedido cancelado. Podés hacer otro desde la web.");
//       }
//     }

//     await upsertMessage({
//       phone: customerPhone,
//       name: customerName,
//       trackingId,
//       order,
//       message: baseMessage,
//     });

//     return new Response("Botón procesado", { status: 200 });
//   }

//   if (type === "text") {
//     console.log("🟩 Mensaje de texto entrante");

//     const phoneNormalized = phone.replace(/\D/g, "");

//     const q = query(
//       collection(db, "orders"),
//       where("customer.phone", "==", phoneNormalized),
//       where("status", "!=", "delivered")
//     );
//     const snap = await getDocs(q);
//     console.log("🔍 Órdenes activas encontradas:", snap.size);

//     let order = null;
//     let trackingId = `tracking_unknown_${phoneNormalized}_${Date.now()}`;
//     let customerName = null;

//     if (!snap.empty) {
//       const doc = snap.docs[0];
//       order = doc.data();
//       trackingId = order.trackingId;
//       customerName = order.customer?.name || null;
//     } else {
//       console.warn("⚠️ No se encontró orden activa para:", phoneNormalized);
//     }

//     const incomingMessage = {
//       direction: "incoming",
//       tipo: "texto",
//       message: message.text?.body || "",
//     };

//     await upsertMessage({
//       phone: phoneNormalized,
//       name: customerName,
//       trackingId,
//       order,
//       message: incomingMessage,
//     });
//   }

//   return new Response("EVENT_RECEIVED", { status: 200 });
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
  console.log("💾 Guardando mensaje en whatsapp_chats");
  console.log("🔁 TrackingId:", trackingId);
  console.log("📱 Teléfono:", phone);
  console.log("💬 Mensaje:", message.message);

  const chatRef = doc(db, "whatsapp_chats", phone);
  const chatSnap = await getDoc(chatRef);
  const timestamp = new Date();
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
      status: "pending",
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

  try {
    await fetch("https://mordisco-ws-production.up.railway.app/notify-whatsapp", {
      method: "POST",
    });
    console.log("📣 Notificación WebSocket enviada");
  } catch (e) {
    console.error("⚠️ Error notificando WebSocket:", e.message);
  }
}

export async function POST(req) {
  const body = await req.json();

  console.log("📥 Webhook recibido");
  console.log("🧾 Body:", JSON.stringify(body, null, 2));

  const change = body.entry?.[0]?.changes?.[0]?.value;
  const message = change?.messages?.[0];
  const type = message?.type;
  const phone = message?.from;

  console.log("📨 Tipo de mensaje:", type);
  console.log("📱 Teléfono del cliente:", phone);

  if (!message || !type || !phone) {
    return new Response("Sin mensaje válido", { status: 200 });
  }

  if (type === "button") {
    console.log("🟡 Botón detectado");

    const originalMessageId = message.context?.id;
    const phoneNormalized = phone.replace(/\D/g, "");

    if (!originalMessageId || !phoneNormalized) {
      return new Response("Faltan datos", { status: 200 });
    }

    const chatRef = doc(db, "whatsapp_chats", phoneNormalized);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      console.warn("⚠️ Chat no encontrado:", phoneNormalized);
      return new Response("Chat no encontrado", { status: 200 });
    }

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

    if (!trackingId) {
      console.warn("⚠️ No se encontró trackingId con ese messageId:", originalMessageId);
      return new Response("No matching order", { status: 200 });
    }

    const q = query(collection(db, "orders"), where("trackingId", "==", trackingId));
    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn("⚠️ Pedido no encontrado:", trackingId);
      return new Response("Pedido no encontrado", { status: 200 });
    }

    const orderDoc = snap.docs[0];
    const order = orderDoc.data();
    const orderRef = orderDoc.ref;

    const baseMessage = {
      direction: "incoming",
      tipo: "texto",
      message: "",
    };

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
        await sendText(phoneNormalized, "✅ Pedido confirmado. ¡Gracias!");
      }
    }

    if (payload.includes("cancelar")) {
      if (order.clientConfirm === true) {
        baseMessage.message = "⚠️ Intentó cancelar un pedido confirmado.";
        await sendText(phoneNormalized, "⚠️ Ya confirmaste tu pedido, no se puede cancelar.");
      } else if (order.status === "cancelled") {
        baseMessage.message = "⚠️ Pedido ya cancelado.";
        await sendText(phoneNormalized, "⚠️ Ya cancelamos tu pedido anteriormente.");
      } else {
        await updateDoc(orderRef, {
          clientConfirm: false,
          clientCancelAt: serverTimestamp(),
          status: "cancelled",
        });
        baseMessage.message = "❌ Pedido cancelado por el cliente.";
        await sendText(phoneNormalized, "❌ Pedido cancelado. Podés hacer otro desde la web.");
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
    console.log("🟩 Mensaje de texto entrante");

    const phoneNormalized = phone.replace(/\D/g, "");

    const q = query(
      collection(db, "orders"),
      where("customer.phone", "==", phoneNormalized),
      where("status", "!=", "delivered")
    );
    const snap = await getDocs(q);
    console.log("🔍 Órdenes activas encontradas:", snap.size);

    let order = null;
    let trackingId = `tracking_unknown_${phoneNormalized}_${Date.now()}`;
    let customerName = null;

    if (!snap.empty) {
      const doc = snap.docs[0];
      order = doc.data();
      trackingId = order.trackingId;
      customerName = order.customer?.name || null;
    } else {
      console.warn("⚠️ No se encontró orden activa para:", phoneNormalized);
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
