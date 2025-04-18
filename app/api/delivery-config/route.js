// app/api/delivery-config/route.js
import { db } from "@/lib/zones/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET() {
  try {
    const configRef = doc(db, "settings", "delivery");
    const snap = await getDoc(configRef);
    if (!snap.exists()) {
      return new Response("No config found", { status: 404 });
    }
    return Response.json(snap.data());
  } catch (err) {
    console.error("Error al obtener delivery config:", err);
    return new Response("Error interno", { status: 500 });
  }
}
