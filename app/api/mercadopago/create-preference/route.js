import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';

// ⚠️ Usamos directamente la URL para descartar variables mal resueltas
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});


export async function POST(req) {
  try {
    const body = await req.json();

    const items = body.cart.map((item) => ({
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: "ARS",
    }));

    if (body.shippingCost > 0) {
      items.push({
        title: "Costo de envío",
        quantity: 1,
        unit_price: body.shippingCost,
        currency_id: "ARS",
      });
    }

    const preference = await new Preference(client).create({
      body: {
        items,
        payer: {
          name: body.customer.name || "Cliente",
          email: body.customer.email || "cliente@mordisco.com",
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/failure`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/pending`,
        },
        // auto_return: "approved", // ✅ solo funciona si back_urls.success está bien
      },
    });

    return NextResponse.json({ init_point: preference.init_point }, { status: 200 });
  } catch (err) {
    console.error("❌ Error creando preferencia MercadoPago:", err);
    return NextResponse.json(
      { error: "Error al crear preferencia", message: err.message },
      { status: 500 }
    );
  }
}
