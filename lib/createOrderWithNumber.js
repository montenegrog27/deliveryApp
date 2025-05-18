import { db } from "@/lib/firebase";
import {
  doc,
  runTransaction,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function createOrderWithNumber(orderData) {
  const counterRef = doc(db, "counters", "orderNumberCounter");

  try {
    const orderNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) throw new Error("El contador de pedidos no existe.");
      const currentNumber = counterDoc.data().value || 1000;
      const nextNumber = currentNumber + 1;
      transaction.update(counterRef, { value: nextNumber });
      return nextNumber;
    });

    // Primero creamos el documento sin el orderId
    const orderRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      orderNumber,
      createdAt: serverTimestamp(),
    });

    // Luego le agregamos el campo orderId con el ID real del documento
    await updateDoc(orderRef, {
      orderId: orderRef.id,
    });

    return orderRef;
  } catch (error) {
    console.error("❌ Error creando el pedido:", error);
    throw error;
  }
}
