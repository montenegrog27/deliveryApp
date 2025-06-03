// /pages/api/settings/delivery.js
import { getDeliveryConfig } from "@/lib/firebase";

export default async function handler(req, res) {
  try {
    const config = await getDeliveryConfig();
    res.status(200).json(config);
  } catch (err) {
    res.status(500).json({ error: "No se pudo obtener la config" });
  }
}
