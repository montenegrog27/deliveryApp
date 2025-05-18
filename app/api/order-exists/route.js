import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { phone, cart, ref } = await req.json();

    const q = query(
      collection(db, "orders"),
      where("customer.phone", "==", phone),
      where("status", "!=", "cancelled") // opcional
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

      // Si coincide por contenido o por ref (más confiable)
      if (match || order.externalRef === ref) {
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
