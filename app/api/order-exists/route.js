// app/api/order-exists/route.js
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { phone, cart } = await req.json();

    const q = query(
      collection(db, "orders"),
      where("customer.phone", "==", phone),
      where("status", "!=", "cancelled") // opcional
    );

    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      const order = doc.data();
      const match =
        order.cart?.length === cart.length &&
        order.cart.every((item, i) => {
          const original = cart[i];
          return item.id === original.id && item.quantity === original.quantity;
        });

      if (match) {
        return NextResponse.json({ exists: true });
      }
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error("❌ Error verificando existencia de orden:", err);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
