import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getActiveOrderByPhone(phoneNormalized) {
  const q = query(
    collection(db, "orders"),
    where("customer.phone", "==", phoneNormalized),
    where("status", "!=", "delivered")
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return {
      order: null,
      trackingId: `tracking_unknown_${phoneNormalized}_${Date.now()}`,
      customerName: null,
    };
  }

  const docSnap = snap.docs[0];
  const order = docSnap.data();
  return { order, trackingId: order.trackingId, customerName: order.customer?.name || null };
}

