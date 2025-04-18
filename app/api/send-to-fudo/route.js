// app/api/send-to-fudo/route.js
import { NextResponse } from "next/server";
import { getFudoToken } from "@/lib/fudo/auth";
import { getProducts } from "@/lib/fudo/products";

export async function POST(req) {
  try {
    const body = await req.json();
    const token = await getFudoToken();

    const fudoUrl = `${process.env.FUDO_API_BASE}/sales`;

    // Obtenemos todos los productos disponibles desde Fudo
    const allProducts = await getProducts();

    // Validamos que cada producto exista y obtenemos su ID
    const items = body.cart.map((cartItem) => {
      const match = allProducts.find((p) => p.id === cartItem.id.toString());
      if (!match) {
        throw new Error(`Producto ${cartItem.id} no encontrado en Fudo`);
      }
      return {
        type: "Item",
        id: match.id,
        quantity: cartItem.quantity,
      };
    });

    // Total calculado desde el backend por seguridad
    const total =
      body.cart.reduce(
        (sum, item) => sum + item.attributes.price * item.quantity,
        0
      ) + (body.shippingCost ?? 0);

    // Payload completo con estructura v1alpha1/sales
    const payload = {
      data: {
        type: "Sale",
        attributes: {
          saleType: "TAKEAWAY", // o "DELIVERY", si ya validaste que lo acepta
          saleState: "PENDING",
          comment: body.customer.observaciones || "",
          total,
          people: 1,
          anonymousCustomer: {
            name: body.customer.name,
            phone: body.customer.phone,
            address: body.customer.address,
          },
          expectedPayments: [
            {
              amount: total,
              paymentMethodId: "1", // Efectivo. Podés cambiarlo si es con QR/MP.
            },
          ],
        },
        relationships: {
          items: {
            data: items.map(({ id }) => ({
              type: "Item",
              id,
            })),
          },
        },
      },
    };

    const res = await fetch(fudoUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Error Fudo:", data);
      return NextResponse.json(
        { error: "Error al enviar a Fudo", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, fudo: data });
  } catch (err) {
    console.error("❌ Error al procesar orden:", err);
    return NextResponse.json(
      { error: "Error en la API", message: err.message },
      { status: 500 }
    );
  }
}
