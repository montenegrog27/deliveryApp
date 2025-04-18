export async function getProducts() {
  const token = await getFudoToken();

  const res = await fetch(`${process.env.FUDO_API_BASE}/products`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Error al obtener productos:", errorText);
    throw new Error("Error al obtener productos de Fudo");
  }

  const json = await res.json();
  return json.data; // 👈 solo la lista de productos
}
