import { db } from "@/lib/firebase";
import { collection, getDocs, query, updateDoc, where, serverTimestamp } from "firebase/firestore";

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

      const [action, trackingId] = payload.split(":"); // ej. "confirmar:tracking_543..."

      if (!trackingId) return new Response("No trackingId", { status: 200 });

      const q = query(collection(db, "orders"), where("trackingId", "==", trackingId));
      const snap = await getDocs(q);

      if (snap.empty) {
        console.warn("⚠️ Pedido no encontrado para", trackingId);
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
        });
        console.log("❌ Pedido cancelado por el cliente.");
      }
    }
  } catch (err) {
    console.error("❌ Error procesando webhook:", err);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
