// lib/fudo/createItems.js
import { getFudoToken } from "./auth";
import { db } from "@/lib/zones/firebase"; // Asegurate de tener esto configurado
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function createItems(cart, saleId) {
  const token = await getFudoToken();

  for (const item of cart) {
    const res = await fetch(`${process.env.FUDO_API_BASE}/items`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "Item",
          attributes: {
            price: item.price,
            quantity: item.quantity,
          },
          relationships: {
            product: {
              data: { id: item.id, type: "Product" },
            },
            sale: {
              data: { id: saleId, type: "Sale" },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("❌ Error creando item en Fudo:", error);
      throw new Error("Error al crear item");
    }

    const createdItem = await res.json();

    // 🔥 Guardar en Firebase
    await addDoc(collection(db, "kds-items"), {
      itemId: createdItem.data.id,
      saleId,
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      kitchenId: item.kitchenId,
      status: "pending",
      timestamp: serverTimestamp(),
    });
  }
}
