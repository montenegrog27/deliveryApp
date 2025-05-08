import { getProducts } from "@/lib/fudo/products";
import { getCategories } from "@/lib/fudo/categories";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [productsResponse, categoriesResponse] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);

    const products = productsResponse.products || productsResponse;
    const categories =
      categoriesResponse.productCategories || categoriesResponse;

    const menu = categories.map((category) => ({
      id: category.id,
      name: category.name,
      items: products.filter(
        (p) =>
          p.relationships?.productCategory?.data?.id &&
          p.relationships.productCategory.data.id === category.id
      ),
    }));

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Error al construir el menú:", error);
    return NextResponse.json(
      { error: "Error obteniendo menú" },
      { status: 500 }
    );
  }
}
