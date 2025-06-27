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
      ref: externalRef,
      orderMode,
      discountType, // <-- nuevo
    } = body;

    if (customer.phone) {
      await saveCustomer(customer);
    }

    // 🔒 Validar cupón si se envió
    if (coupon && customer.phone) {
      const q = query(collection(db, "coupons"), where("code", "==", coupon));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        const docData = snap.docs[0].data();
        const usedBy = Array.isArray(docData.usedBy) ? docData.usedBy : [];

        const alreadyUsed = usedBy.some((u) => {
          if (u.phone !== customer.phone) return false;

          if (docData.usageLimit === "once") return true;

          if (docData.usageLimit === "once_per_week") {
            const usedDate = new Date(u.date);
            const diff = Date.now() - usedDate.getTime();
            return diff < 7 * 24 * 60 * 60 * 1000; // menos de una semana
          }

          return false;
        });

        if (alreadyUsed) {
          return NextResponse.json(
            { error: "Este cupón ya fue usado por este número." },
            { status: 400 }
          );
        }
      }
    }

    // Calcular totales
    const totalBase = cart.reduce(
      (sum, it) =>
        sum + Number(it.discountPrice || it.price) * Number(it.quantity),
      0
    );

    const manualDiscountFixed = Number(manualDiscount || 0);
    const couponDiscountFixed = Number(couponDiscount || 0);
    console.log("couponDiscountFixed", couponDiscountFixed);
    console.log("manualDiscountFixed", manualDiscountFixed);

    // const discountAmount = Number(couponDiscountFixed || 0) + Number(manualDiscount || 0);

const discountAmount = Number(couponDiscountFixed || 0) + Number(manualDiscountFixed || 0);


    const total = Math.max(totalBase - discountAmount + (shippingCost || 0), 0);
    const shipping = Number(shippingCost || 0);
    // Cargar datos de recetas e ingredientes
    const [recipesSnap, ingredientsSnap] = await Promise.all([
      getDocs(collection(db, "recipes")),
      getDocs(collection(db, "ingredients")),
    ]);
    // Mapas rápidos
    const recetasMap = {};
    recipesSnap.docs.forEach((d) => {
      const r = d.data();
      recetasMap[r.productId] ??= [];
      recetasMap[r.productId].push(r);
    });
    const ingCostMap = {};
    ingredientsSnap.docs.forEach((d) => {
      ingCostMap[d.id] = d.data().cost || 0;
    });

    // Calcular costoIngredientes dinámicamente considerando combos
    const combosMap = {};
    let costoIngredientes = 0;
    for (const item of cart) {
      const qtyItem = item.quantity;
      // Inicializar combosMap[item.id] si no existe
      if (!(item.id in combosMap)) {
        const prodSnap = await getDoc(doc(db, "products", item.id));
        if (prodSnap.exists() && prodSnap.data().isCombo) {
          combosMap[item.id] = prodSnap.data().comboItems || [];
        } else {
          combosMap[item.id] = null;
        }
      }
      const comboItems = combosMap[item.id];
      if (comboItems) {
        // Es combo: expandir a productos
        for (const sub of comboItems) {
          const recs = recetasMap[sub.productId] || [];
          recs.forEach((r) => {
            const costUnit = ingCostMap[r.ingredientId] || 0;
            costoIngredientes += costUnit * r.quantity * sub.quantity * qtyItem;
          });
        }
      } else {
        // Producto individual
        const recs = recetasMap[item.id] || [];
        recs.forEach((r) => {
          const costUnit = ingCostMap[r.ingredientId] || 0;
          costoIngredientes += costUnit * r.quantity * qtyItem;
        });
      }
    }
    const ganancia = total - shipping - costoIngredientes;

    // Preparar orden
    const trackingId = `tracking_${externalRef}`;
    const orderData = {
      branch: kitchenId,
      cashier: "cliente-web",
      delivery: orderMode === "delivery",
      items: cart,
      paymentMethodId: paymentMethod || "cash",
      paid: paid || false,
      status: "pending",
      total,
      coupon: coupon || null,
      couponDiscount: couponDiscount || 0,
      discountAmount,
      shippingCost,
      customer,
      trackingId,
      externalRef,
      costoIngredientes,
      ganancia,
      notes: notes || "",
    };

    const ref = await createOrderWithNumber(orderData);

    // 📝 Guardar uso del cupón
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
