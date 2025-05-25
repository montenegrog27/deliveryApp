
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

    const fullTrackingId = `tracking_${trackingId}`;
    console.log("🟡 Buscando trackingId:", fullTrackingId);

    const q = query(
      collection(db, "orders"),
      where("trackingId", "==", fullTrackingId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn("⚠️ No se encontró la orden con trackingId:", fullTrackingId);
      return new Response("Pedido no encontrado", { status: 200 });
    }

    const orderRef = snap.docs[0].ref;

    if (action === "confirmar") {
      await updateDoc(orderRef, {
        clientConfirm: true,
        clientConfirmAt: serverTimestamp(),
      });
      console.log("✅ Pedido confirmado por el cliente.");
    } else if (action === "cancelar") {
      await updateDoc(orderRef, {
        clientConfirm: false,
        clientCancelAt: serverTimestamp(),
        status: "cancelled",
      });
      console.log("❌ Pedido cancelado por el cliente.");
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
        messages: [],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Agregar nuevo mensaje
    await updateDoc(chatRef, {
      messages: arrayUnion({
        message: message.text.body,
        direction: "incoming",
        timestamp: new Date(),
      }),
      updatedAt: serverTimestamp(),
    });

    console.log("📩 Mensaje guardado en whatsapp_chats:", trackingId);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
