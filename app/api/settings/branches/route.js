import { getBranches } from "@/lib/firebase";

export async function GET() {
  try {
    const branches = await getBranches();
    return Response.json({ branches });
  } catch (err) {
    console.error("❌ Error al obtener sucursales:", err);
    return new Response(
      JSON.stringify({ error: "No se pudo obtener sucursales" }),
      { status: 500 }
    );
  }
}
