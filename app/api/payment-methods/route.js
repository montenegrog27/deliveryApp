import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const snap = await getDocs(collection(db, "paymentMethods"));
    const methods = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return Response.json(methods);
  } catch (err) {
    console.error("❌ Error al obtener métodos de pago:", err);
    return new Response("Error interno al obtener métodos de pago", { status: 500 });
  }
}
