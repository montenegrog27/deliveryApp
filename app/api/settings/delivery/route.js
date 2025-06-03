// app/api/settings/delivery/route.js
import { getDeliveryConfig } from "@/lib/firebase";

export async function GET() {
  try {
    const config = await getDeliveryConfig();
    return Response.json(config);
  } catch (err) {
    console.error("❌ Error al obtener configuración de delivery:", err);
    return new Response(
      JSON.stringify({ error: "No se pudo obtener la configuración" }),
      { status: 500 }
    );
  }
}
