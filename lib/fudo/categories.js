import { getFudoToken } from "./auth";

export async function getCategories() {
  const token = await getFudoToken();

  const res = await fetch(`${process.env.FUDO_API_BASE}/product-categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Error al obtener categorías:", errorText);
    throw new Error("Error al obtener categorías de Fudo");
  }

  const json = await res.json();
  return json.data; // 👈 este es el array de categorías reales
}
