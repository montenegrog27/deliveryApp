// pages/api/recipes.js
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const snapshot = await getDocs(collection(db, "recipes"));
    const recipes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(recipes);
  } catch (error) {
    console.error("❌ Error al obtener recetas:", error);
    return res.status(500).json({ error: "Error al obtener recetas" });
  }
}
