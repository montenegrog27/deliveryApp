import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export const GET = async () => {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    return new Response("Error al obtener productos", { status: 500 });
  }
};
