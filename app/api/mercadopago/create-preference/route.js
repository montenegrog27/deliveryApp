import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';

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

const externalRef = body.ref;

const orderPayload = {
  customer: body.customer,
  cart: body.cart,
  shippingCost: body.shippingCost,
  kitchenId: body.kitchenId,
  paymentMethod: body.paymentMethodId,
  paid: true,
  notes: body.notes || "",
  external_reference: externalRef,
};


    const preference = await new Preference(client).create({
      body: {
        items,
        payer: {
          name: body.customer.name || "Cliente",
          email: body.customer.email || "cliente@mordisco.com",
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?ref=${externalRef}`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/failure`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/pending`,
        },
        auto_return: "approved",
        external_reference: externalRef,
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook`,
      },
    });

    return NextResponse.json(
      { init_point: preference.init_point, external_reference: externalRef, orderPayload },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error creando preferencia MercadoPago:", err);
    return NextResponse.json(
      { error: "Error al crear preferencia", message: err.message },
      { status: 500 }
    );
  }
}
