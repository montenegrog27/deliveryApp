// import { db } from "@/lib/firebase";
// import {
//   collection,
//   getDocs,
//   query,
//   updateDoc,
//   where,
//   serverTimestamp,
//   addDoc,
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

//   // Botón
//   if (type === "button") {
//     const payload = message?.button?.payload;
//     const [action, trackingId] = payload.split(":");

//     if (!trackingId) return new Response("No trackingId", { status: 200 });

//     const fullTrackingId = `tracking_${trackingId}`; // 🔥 fix
//     console.log("🟡 Buscando trackingId:", fullTrackingId);

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

//     const orderRef = snap.docs[0].ref;

//     if (action === "confirmar") {
//       await updateDoc(orderRef, {
//         clientConfirm: true,
//         clientConfirmAt: serverTimestamp(),
//       });
//       console.log("✅ Pedido confirmado por el cliente.");
//     } else if (action === "cancelar") {
//       await updateDoc(orderRef, {
//         clientConfirm: false,
//         clientCancelAt: serverTimestamp(),
//         status: "cancelled",
//       });
//       console.log("❌ Pedido cancelado por el cliente.");
//     }
//   }

//   // Mensaje de texto
//   if (type === "text") {
//     const q = query(
//       collection(db, "orders"),
//       where("customer.phone", "==", phone)
//     );
//     const snap = await getDocs(q);

//     const data = {
//       phone,
//       message: message.text.body,
//       timestamp: new Date(),
//       direction: "incoming",
//     };

//     if (!snap.empty) {
//       const order = snap.docs[0].data();
//       data.orderNumber = order.orderNumber || null;
//       data.status = order.status || null;
//       data.name = order.customer?.name || null;
//       data.trackingId = order.trackingId || null;
//     }

//     await addDoc(collection(db, "whatsapp_messages"), data);
//   }

//   return new Response("EVENT_RECEIVED", { status: 200 });
// }

// pages/api/webhook.js o donde esté tu endpoint

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
  arrayUnion,
} from "firebase/firestore";

export async function POST(req) {
  const body = await req.json();
  const change = body.entry?.[0]?.changes?.[0]?.value;
  const message = change?.messages?.[0];
  const type = message?.type;
  const phone = message?.from;

  if (!message || !type || !phone) {
    return new Response("Sin mensaje válido", { status: 200 });
  }

  // 📍 BOTONES (Confirmar o Cancelar)
  if (type === "button") {
    const payload = message?.button?.payload;
    const [action, trackingId] = payload.split(":");

    if (!trackingId) return new Response("No trackingId", { status: 200 });

    const fullTrackingId = trackingId.startsWith("tracking_")
      ? trackingId
      : `tracking_${trackingId}`;
    console.log("🟡 Buscando trackingId:", fullTrackingId);

    const q = query(
      collection(db, "orders"),
      where("trackingId", "==", fullTrackingId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn(
        "⚠️ No se encontró la orden con trackingId:",
        fullTrackingId
      );
      return new Response("Pedido no encontrado", { status: 200 });
    }

    const orderRef = snap.docs[0].ref;

    if (action === "confirmar") {
      await updateDoc(orderRef, {
        clientConfirm: true,
        clientConfirmAt: serverTimestamp(),
      });
      console.log("✅ Pedido confirmado por el cliente.");

      const order = snap.docs[0].data();
      const customerPhone = order.customer?.phone?.replace(/\D/g, "");
      const customerName = order.customer?.name || "cliente";
      const trackingId = order.trackingId;

      const textMessage =
        "✅ Pedido confirmado, muchas gracias por elegirnos!\nTe avisaremos cuando el cadete esté yendo, y también cuando esté fuera de tu domicilio.\n¡Gracias!";

      try {
        await fetch(
          "https://graph.facebook.com/v19.0/" +
            process.env.WHATSAPP_PHONE_NUMBER_ID +
            "/messages",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: customerPhone,
              type: "text",
              text: { body: textMessage },
            }),
          }
        );

        console.log("📤 Mensaje de confirmación enviado por WhatsApp");
      } catch (err) {
        console.error("❌ Error al enviar mensaje de confirmación:", err);
      }
    } else if (action === "cancelar") {
      await updateDoc(orderRef, {
        clientConfirm: false,
        clientCancelAt: serverTimestamp(),
        status: "cancelled",
      });
      console.log("❌ Pedido cancelado por el cliente.");

      const order = snap.docs[0].data();
      const customerPhone = order.customer?.phone?.replace(/\D/g, "");
      const cancelMessage =
        "❌ Orden cancelada. Muchas gracias por responder.\nSi fue un error, podés hacer un nuevo pedido desde mordiscoburgers.com.ar/pedidos";

      try {
        await fetch(
          "https://graph.facebook.com/v19.0/" +
            process.env.WHATSAPP_PHONE_NUMBER_ID +
            "/messages",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: customerPhone,
              type: "text",
              text: { body: cancelMessage },
            }),
          }
        );

        console.log("📤 Mensaje de cancelación enviado por WhatsApp");
      } catch (err) {
        console.error("❌ Error al enviar mensaje de cancelación:", err);
      }
    }
  }

  // 🟩 MENSAJE DE TEXTO NORMAL
  if (type === "text") {
    // Buscar la orden asociada al número
    const q = query(
      collection(db, "orders"),
      where("customer.phone", "==", phone)
    );
    const snap = await getDocs(q);

    const order = !snap.empty ? snap.docs[0].data() : null;
    const trackingId = order?.trackingId || `chat_${phone}`; // Fallback si no hay pedido aún
    const chatRef = doc(db, "whatsapp_chats", trackingId);

    // Crear documento si no existe (con merge)
    await setDoc(
      chatRef,
      {
        orderNumber: order?.orderNumber || null,
        phone,
        name: order?.customer?.name || null,
        trackingId: order?.trackingId || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ); // ← ⚠️ importante

    await updateDoc(chatRef, {
      messages: arrayUnion({
        message: message.text.body,
        direction: "incoming",
        tipo: "texto",
        timestamp: new Date(),
      }),
      updatedAt: serverTimestamp(),
    });

    console.log("📩 Mensaje guardado en whatsapp_chats:", trackingId);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
