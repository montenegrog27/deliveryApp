import { getFudoToken } from "./auth";

export async function getProductsByIds(ids = []) {
  const token = await getFudoToken();

  const allProducts = await fetch(`${process.env.FUDO_API_BASE}/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!allProducts.ok) {
    const error = await allProducts.text();
    throw new Error(`Error al obtener productos: ${error}`);
  }

  const json = await allProducts.json();

  // Filtramos solo los que están en la lista de ids
  return json.data.filter((product) => ids.includes(product.id));
}
