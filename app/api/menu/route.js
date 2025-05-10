// app/api/menu/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [prodSnap, catSnap] = await Promise.all([
      getDocs(query(collection(db, "products"), orderBy("name"))),
      getDocs(query(collection(db, "categories"), orderBy("name"))),
    ]);

    const products = prodSnap.docs.map((doc) => ({
      id: doc.id,
      attributes: doc.data(),
    }));

    const categories = catSnap.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      inOrder:doc.data().inOrder,
      active:doc.data().active
    }));

    const menu = categories.map((category) => ({
      id: category.id,
      name: category.name,
      active:category.active,
      inOrder:category.inOrder,
      items: products.filter(
        (p) => p.attributes.categoryId === category.id
      ),
    }));

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Error al construir el menú:", error);
    return NextResponse.json(
      { error: "Error obteniendo menú" },
      { status: 500 }
    );
  }
}
