// pages/api/settings/branches.js
import { getBranches } from "@/lib/firebase";

export default async function handler(req, res) {
  try {
    const branches = await getBranches();
    res.status(200).json({ branches });
  } catch (err) {
    console.error("❌ Error al obtener sucursales:", err);
    res.status(500).json({ error: "No se pudo obtener sucursales" });
  }
}
