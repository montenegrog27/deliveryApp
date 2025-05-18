import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { phone, cart = [], ref } = await req.json();

    // Si viene ref, buscar directamente por ref (es más confiable y rápido)
    if (ref) {
      const q = query(collection(db, "orders"), where("externalRef", "==", ref));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const order = snap.docs[0].data();
        return NextResponse.json({
          exists: true,
          trackingId: order.trackingId || null,
        });
      }
    }

    // Si no hay ref, buscar por teléfono y cart
    if (!phone || !cart.length) {
      return NextResponse.json({ exists: false });
    }

    const q = query(
      collection(db, "orders"),
      where("customer.phone", "==", phone),
      where("status", "!=", "cancelled")
    );

    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      const order = doc.data();

      const match =
        order.items?.length === cart.length &&
        order.items.every((item, i) => {
          const original = cart[i];
          return item.id === original.id && item.quantity === original.quantity;
        });

      if (match) {
        return NextResponse.json({
          exists: true,
          trackingId: order.trackingId || null,
        });
      }
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error("❌ Error verificando existencia de orden:", err);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
