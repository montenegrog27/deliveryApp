// PROBLEMA: Los mensajes no incluyen ni `trackingId` ni el `orderId`, por lo tanto
// en cashier no es posible hacer match entre un mensaje y una orden si no hay un pedido cargado todavía.

// SOLUCIÓN: Modificá tu webhook de pedidos para que al guardar un mensaje de WhatsApp
// se incluya también la info de la orden activa (si existe): nombre, trackingId, estado, orderNumber.

// 🚧 MODIFICADO: webhook en el proyecto de pedidos (API route POST)
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
  addDoc,
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

  // Botón
  if (type === "button") {
    const payload = message?.button?.payload;
    const [action, trackingId] = payload.split(":");

    if (!trackingId) return new Response("No trackingId", { status: 200 });

    const q = query(collection(db, "orders"), where("trackingId", "==", trackingId));
    const snap = await getDocs(q);

    if (snap.empty) return new Response("Pedido no encontrado", { status: 200 });

    const orderRef = snap.docs[0].ref;

    if (action === "confirmar") {
      await updateDoc(orderRef, {
        clientConfirm: true,
        clientConfirmAt: serverTimestamp(),
      });
    } else if (action === "cancelar") {
      await updateDoc(orderRef, {
        clientConfirm: false,
        clientCancelAt: serverTimestamp(),
        status: "cancelled",
      });
    }
  }

  // Mensaje de texto
  if (type === "text") {
    const q = query(collection(db, "orders"), where("customer.phone", "==", phone));
    const snap = await getDocs(q);

    const data = {
      phone,
      message: message.text.body,
      timestamp: new Date(),
      direction: "incoming",
    };

    if (!snap.empty) {
      const order = snap.docs[0].data();
      data.orderNumber = order.orderNumber || null;
      data.status = order.status || null;
      data.name = order.customer?.name || null;
      data.trackingId = order.trackingId || null;
    }

    await addDoc(collection(db, "whatsapp_messages"), data);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
