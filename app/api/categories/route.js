import { getCategories } from "@/lib/fudo/categories";

export async function GET() {
  try {
    const categories = await getCategories();
    console.log("✅ Categorías:", categories);
    return Response.json(categories);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return new Response("Error al obtener categorías", { status: 500 });
  }
}
