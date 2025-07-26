import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export const GET = async () => {
  try {
    const snapshot = await getDocs(collection(db, "recipes"));
    const recipes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return new Response(JSON.stringify(recipes), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener recetas:", error);
    return new Response("Error al obtener recetas", { status: 500 });
  }
};
