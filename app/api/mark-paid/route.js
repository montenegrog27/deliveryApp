import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { ref } = await req.json();

    if (!ref) {
      return NextResponse.json({ error: "Falta ref" }, { status: 400 });
    }

    const q = query(collection(db, "orders"), where("externalRef", "==", ref));
    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json({ error: "No se encontró el pedido" }, { status: 404 });
    }

    const orderDoc = snap.docs[0];
    const orderRef = doc(db, "orders", orderDoc.id);

    // Actualiza el campo paid y opcionalmente status
    await updateDoc(orderRef, {
      paid: true,
      status: "preparing", // opcional: asegurás que no quede en estado incorrecto
    });

    const trackingId = orderDoc.data().trackingId || null;

    return NextResponse.json({ ok: true, trackingId });
  } catch (err) {
    console.error("❌ Error en /api/mark-paid:", err);
    return NextResponse.json({ error: "Error al actualizar el pago" }, { status: 500 });
  }
}
