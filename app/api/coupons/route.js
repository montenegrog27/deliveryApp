import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toLowerCase();

  if (!code) return new Response("Código requerido", { status: 400 });

  const q = query(
    collection(db, "coupons"),
    where("code", "==", code)
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    return new Response("Cupón no encontrado", { status: 404 });
  }

  const data = snap.docs[0].data();
  return Response.json(data);
}
