import { NextResponse } from "next/server";

const kitchens = [
  {
    id: "local",
    name: "Sucursal Santa Fe",
    lat: -27.4715,
    lng: -58.8425,
  },
  {
    id: "dark",
    name: "Dark Kitchen G. Cruz",
    lat: -27.4683,
    lng: -58.8185,
  },
];

// Haversine para calcular la cocina más cercana
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req) {
  try {
    const { customer, cart } = await req.json();

    if (!customer || !cart || cart.length === 0)
      return NextResponse.json(
        { error: "Faltan datos del cliente o carrito vacío." },
        { status: 400 }
      );

    const { lat, lng } = customer;
    const nearest = kitchens
      .map((k) => ({
        ...k,
        distance: haversine(lat, lng, k.lat, k.lng),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    console.log("📦 Enviar pedido a cocina:", nearest.name);

    // 💡 Aquí deberías construir y enviar el pedido real a Fudo
    // const token = await getFudoToken()
    // const res = await fetch("https://api.fudo.com/.../orders", {...})

    return NextResponse.json({
      ok: true,
      cocina: nearest.name,
      cocina_id: nearest.id,
      cliente: customer.name,
      productos: cart.map((i) => ({
        nombre: i.attributes.name,
        cantidad: i.quantity,
        subtotal: i.quantity * i.attributes.price,
      })),
      total: cart.reduce((sum, i) => sum + i.quantity * i.attributes.price, 0),
    });
  } catch (err) {
    console.error("❌ Error en /api/order:", err);
    return NextResponse.json(
      { error: "Error procesando pedido" },
      { status: 500 }
    );
  }
}
