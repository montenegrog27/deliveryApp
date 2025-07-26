import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "ID faltante" }, { status: 400 });
  }

  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const product = {
      id: docSnap.id,
      ...docSnap.data(),
    };

    return NextResponse.json(product);
  } catch (error) {
    console.error("❌ Error al obtener producto:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
