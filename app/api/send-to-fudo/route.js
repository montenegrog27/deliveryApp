import { NextResponse } from "next/server";
import { getFudoToken } from "@/lib/fudo/auth";
import { getProductsByIds } from "@/lib/fudo/getProductsByIds";
import { findOrCreateCustomer } from "@/lib/fudo/customers";
import { createItems } from "@/lib/fudo/createItems";

export async function POST(req) {
  try {
    const body = await req.json();
    const token = await getFudoToken();

    // Traer productos válidos
    const productList = await getProductsByIds(
      body.cart.map((item) => item.id)
    );

    // Calcular total
    const total = productList.reduce((sum, product) => {
      const quantity =
        body.cart.find((i) => i.id === product.id)?.quantity || 1;
      return sum + product.attributes.price * quantity;
    }, body.shippingCost || 0);

    // Armar ítems
    const itemData = {
      data: productList.map((product) => ({
        id: product.id,
        type: "Item",
      })),
    };

    //buscar customer

    const customerId = await findOrCreateCustomer({
      name: body.customer.name,
      email: body.customer.email,
      phone: body.customer.phone,
      address: body.customer.address,
    });
    console.log("CUSTOMER IDDDD", toString(customerId));

    // Armar estructura
    const salePayload = {
      data: {
        type: "Sale",
        attributes: {
          saleType: "TAKEAWAY", // o "EAT-IN"
          comment: body.notes || "Pedido online",
          people: 1,
          customerName: body.customer.name,
        },
        relationships: {
          customer: {
            data: {
              id: toString(customerId),
              type: "Customer",
            },
          },
          waiter: {
            data: {
              id: "1",
              type: "User",
            },
          },
        },
      },
    };
    console.log("fudoPayloadddddd", JSON.stringify(salePayload));

    const res = await fetch(`${process.env.FUDO_API_BASE}/sales`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(salePayload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("❌ Error Fudo:", data);
      return NextResponse.json(
        { error: "Error al enviar a Fudo", details: data },
        { status: 500 }
      );
    }

    // 2. Crear los ítems asociados a la venta
    await createItems(
      productList.map((p) => ({
        id: p.id,
        price: p.attributes.price,
        quantity: body.cart.find((c) => c.id === p.id)?.quantity || 1,
        name: p.attributes.name,
        kitchenId: body.kitchenId, // 👈 nuevo
      })),
      data.data.id // saleId
    );

    return NextResponse.json({ ok: "ok" }, { status: 200 });
  } catch (err) {
    console.error("❌ Error en la API:", err);
    return NextResponse.json(
      { error: "Error en la API", message: err.message },
      { status: 500 }
    );
  }
}
