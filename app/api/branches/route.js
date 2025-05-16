// import { db } from "@/lib/firebase";
// import { collection, getDoc, doc } from "firebase/firestore";
// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     // Obtenemos el documento de settings/branches
//     const ref = doc(collection(db, "settings"), "branches");
//     const snap = await getDoc(ref);

//     if (!snap.exists()) {
//       return NextResponse.json({ error: "No se encontraron sucursales" }, { status: 404 });
//     }

//     const branches = snap.data().branches || [];

//     return NextResponse.json(branches, { status: 200 });
//   } catch (err) {
//     console.error("❌ Error al traer sucursales:", err);
//     return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
//   }
// }
import { db } from "@/lib/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

const FORCE_OPEN = process.env.FORCE_BRANCH_OPEN === "true"; // 👉 cambiá esta variable en `.env.local`

function isBranchOpen(now, from, to) {
  if (!from || !to) return false;

  const [fromH, fromM] = from.split(":").map(Number);
  const [toH, toM] = to.split(":").map(Number);

  const fromDate = new Date(now);
  fromDate.setHours(fromH, fromM, 0, 0);

  const toDate = new Date(now);
  toDate.setHours(toH, toM, 0, 0);

  if (toDate <= fromDate) toDate.setDate(toDate.getDate() + 1);

  return now >= fromDate && now <= toDate;
}

export async function GET() {
  try {
    const docRef = doc(collection(db, "settings"), "branches");
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json([], { status: 200 });
    }

    const branches = snap.data().branches || [];

    if (FORCE_OPEN) {
      return NextResponse.json(branches, { status: 200 });
    }

    const now = new Date();
    const day = now.toLocaleDateString("es-AR", { weekday: "long" }).toLowerCase();

    const abiertas = branches.filter((b) => {
      const bh = b.businessHours?.[day];
      return bh?.open && isBranchOpen(now, bh.from, bh.to);
    });

    return NextResponse.json(abiertas, { status: 200 });
  } catch (err) {
    console.error("❌ Error al obtener branches:", err);
    return NextResponse.json({ error: "Error al obtener branches" }, { status: 500 });
  }
}
