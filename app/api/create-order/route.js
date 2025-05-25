import { NextResponse } from "next/server";
import { createOrderWithNumber } from "@/lib/createOrderWithNumber";
import { saveCustomer } from "@/lib/saveCustomer";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      customer,
      shippingCost,
      notes,
      kitchenId,
      cart,
      coupon,
      couponDiscount,
      manualDiscount,
      paymentMethod,
      paid,
      ref: externalRef, // ✅ Traemos la referencia externa del body
    } = body;

    if (customer.phone) {
      await saveCustomer(customer);
    }

    // const totalBase = cart.reduce(
    //   (sum, it) => sum + (it.discountPrice || it.price) * it.quantity,
    //   0
    // );

    const totalBase = cart.reduce(
      (sum, it) =>
        sum + Number(it.discountPrice || it.price) * Number(it.quantity),
      0
    );

    const manualDiscountFixed = Number(manualDiscount || 0);
    const couponDiscountFixed = Number(couponDiscount || 0);

    const discountAmount =
      totalBase * ((couponDiscountFixed + manualDiscountFixed) / 100);

    // const discountAmount =
    //   totalBase * ((couponDiscount + manualDiscount) / 100);

    const total = Math.max(totalBase - discountAmount + (shippingCost || 0), 0);

    const trackingId = `tracking_${externalRef}`; // ✅ Creamos el tracking ID

    const orderData = {
      branch: kitchenId,
      cashier: "cliente-web",
      delivery: true,
      items: cart,
      notes,
      paymentMethodId: paymentMethod || "cash",
      paid: paid || false,
      status: "preparing",
      total,
      coupon: coupon || null,
      couponDiscount: couponDiscount || 0,
      discountAmount: discountAmount || 0,
      shippingCost,
      customer,
      trackingId, // ✅ Guardamos el tracking ID
      externalRef, // ✅ Guardamos la ref externa para evitar duplicados
    };

    const ref = await createOrderWithNumber(orderData);

    // ✅ Registrar uso del cupón (si aplica)
    if (coupon && customer.phone) {
      const q = query(collection(db, "coupons"), where("code", "==", coupon));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        const currentData = snap.docs[0].data();

        const usedBy = Array.isArray(currentData.usedBy)
          ? [...currentData.usedBy]
          : [];

        usedBy.push({
          phone: customer.phone,
          date: new Date().toISOString(),
        });

        await updateDoc(docRef, { usedBy });
      }
    }

    // 🔻 Descontar stock
    for (const item of cart) {
      const recipeQuery = query(
        collection(db, "recipes"),
        where("productId", "==", item.id)
      );
      const recipeSnap = await getDocs(recipeQuery);

      for (const docReceta of recipeSnap.docs) {
        const receta = docReceta.data();
        const ingredienteRef = doc(db, "ingredients", receta.ingredientId);
        const ingredienteSnap = await getDoc(ingredienteRef);
        if (!ingredienteSnap.exists()) continue;

        const ingrediente = ingredienteSnap.data();
        const cantidadOriginal = Number(ingrediente.stock ?? 0);
        const cantidadADescontar = receta.quantity * item.quantity;

        await updateDoc(ingredienteRef, {
          stock: Math.max(0, cantidadOriginal - cantidadADescontar),
        });
      }
    }

    return NextResponse.json({ ok: true, trackingId }, { status: 200 });
  } catch (err) {
    console.error("❌ Error en create-order:", err);
    return NextResponse.json(
      { error: "Error al crear pedido", message: err.message },
      { status: 500 }
    );
  }
}
