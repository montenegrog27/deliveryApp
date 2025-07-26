import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Falta el ID de la categoría" }), {
      status: 400,
    });
  }

  try {
    const ref = doc(db, "categories", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return new Response(JSON.stringify({ error: "Categoría no encontrada" }), {
        status: 404,
      });
    }

    const data = snap.data();
    return new Response(JSON.stringify({ id: snap.id, ...data }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error al obtener categoría:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
    });
  }
}
