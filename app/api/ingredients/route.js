import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const snapshot = await getDocs(collection(db, "ingredients"));
    const ingredients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(ingredients);
  } catch (error) {
    console.error("❌ Error al obtener ingredientes:", error);
    res.status(500).json({ error: "Error al obtener ingredientes" });
  }
}
