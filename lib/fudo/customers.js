import { getFudoToken } from "./auth";

export async function findOrCreateCustomer({ name, email, phone, address }) {
  const token = await getFudoToken();

  // Paso 1: Obtener todos los clientes (paginado simple)
  const res = await fetch(
    `${process.env.FUDO_API_BASE}/customers?page[size]=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Error al obtener clientes:", errorText);
    throw new Error("Error al obtener clientes de Fudo");
  }

  const { data: customers } = await res.json();

  // Paso 2: Buscar por email
  const existing = customers.find((c) => c.attributes.email === email);
  if (existing) return existing.id;

  // Paso 3: Crear nuevo cliente
  const createRes = await fetch(`${process.env.FUDO_API_BASE}/customers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "Customer",
        attributes: {
          name,
          email,
          phone,
          address: address,
          active: true,
        },
        relationships: {
          paymentMethod: {
            data: {
              id: "1", // Efectivo
              type: "PaymentMethod",
            },
          },
        },
      },
    }),
  });

  const created = await createRes.json();

  if (!createRes.ok) {
    console.error("❌ Error al crear cliente:", created);
    throw new Error("Error al crear cliente en Fudo");
  }

  return created.data.id;
}
