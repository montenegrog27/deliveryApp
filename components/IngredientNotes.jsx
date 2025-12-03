

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const INGREDIENTES_NO_EDITABLES = [
  "pan",
  "medallón",
  "medallon",
  "carne",
  "papas fritas",
  "papas",
];

export default function IngredientNotes({
  productId,
  onAddNote,
  currentNote = "",
  onExtrasChange,
    onLoadingChange, 
}) {
  const [tags, setTags] = useState([]);
  const [extrasFijos, setExtrasFijos] = useState([]);
  const [extrasFijosSeleccionados, setExtrasFijosSeleccionados] = useState([]);
  const [productType, setProductType] = useState(""); // ← "burger", "dessert", etc.

useEffect(() => {
  const fetchData = async () => {
    try {
      // 🔥 1. Obtener datos del producto
            onLoadingChange?.(true); // 👈 Inicia carga
      const productRes = await fetch(`/api/productsId/${productId}`);
      if (!productRes.ok) throw new Error("No se pudo cargar el producto");

      const productData = await productRes.json();
      const isBurger = productData.isBurger === true || productData.isCombo === true;

      // 🔥 2. Filtrar extras desde Firestore por active === true
      const extrasSnap = await getDocs(
        query(collection(db, "productExtras"), where("active", "==", true))
      );

      const extrasFromDB = extrasSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((extra) =>
          isBurger ? extra.productTypes?.includes("burger") : false
        );

      setExtrasFijos(extrasFromDB);

      // 🔥 3. Obtener ingredientes para "Sin lechuga"
      const [recipesRes, ingredientsRes] = await Promise.all([
        fetch("/api/recipes"),
        fetch("/api/ingredients"),
      ]);

      if (!recipesRes.ok || !ingredientsRes.ok)
        throw new Error("No se pudo cargar recetas o ingredientes");

      const recipes = await recipesRes.json();
      const ingredients = await ingredientsRes.json();

      let productosParaAnalizar = [];

      if (productData.isCombo && Array.isArray(productData.comboItems)) {
        productosParaAnalizar = productData.comboItems.map(
          (item) => item.productId
        );
      } else {
        productosParaAnalizar = [productId];
      }

      const sugeridos = new Set();

      for (const pid of productosParaAnalizar) {
        const recetasProducto = recipes.filter((r) => r.productId === pid);

        for (const receta of recetasProducto) {
          const ingrediente = ingredients.find(
            (i) => i.id === receta.ingredientId
          );
          if (!ingrediente) continue;

          const nombre = ingrediente.name.toLowerCase();
          const esBloqueado = INGREDIENTES_NO_EDITABLES.some((base) =>
            nombre.includes(base)
          );

          if (!esBloqueado) {
            sugeridos.add(ingrediente.name);
          }
        }
      }

      setTags([...sugeridos].sort((a, b) => a.localeCompare(b)));
    } catch (err) {
      console.error("❌ Error en IngredientNotes:", err);
    } finally {
      onLoadingChange?.(false);
    }
  };

  fetchData(); // ✅ Llamada dentro del efecto correctamente
}, [productId]);
console.log("pagina de extras")

  // Enviar al padre los extras seleccionados
  useEffect(() => {
    if (onExtrasChange) {
      const extrasSeleccionados = extrasFijos.filter((e) =>
        extrasFijosSeleccionados.includes(e.id)
      );
      onExtrasChange(extrasSeleccionados);
    }
  }, [extrasFijosSeleccionados]);

  const notesArray = currentNote
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n.toLowerCase().startsWith("sin "));

  const isActive = (tag) =>
    notesArray.includes(`Sin ${tag}`) || notesArray.includes(`sin ${tag}`);

  return (
    <div className="w-full space-y-4 mt-4">
      {/* 🔥 SECCIÓN DE EXTRAS PAGOS */}
      {extrasFijos.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Agregados</p>
          <div className="flex flex-col gap-2">
            {extrasFijos.map((extra) => (
              <button
                key={extra.id}
                type="button"
                onClick={() => {
                  setExtrasFijosSeleccionados((prev) =>
                    prev.includes(extra.id)
                      ? prev.filter((id) => id !== extra.id)
                      : [...prev, extra.id]
                  );
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-all
                ${
                  extrasFijosSeleccionados.includes(extra.id)
                    ? "bg-red-100 border-red-500 text-red-700 font-semibold"
                    : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span>{extra.name}</span>
                <span className="font-bold">+ ${extra.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🔧 INGREDIENTES PARA QUITAR */}
      <div>
        <p className="text-sm font-semibold mb-2">Quitar ingredientes</p>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <span className="text-sm text-neutral-400">
              No hay sugerencias
            </span>
          ) : (
            tags.map((tag, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onAddNote(`Sin ${tag}`)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-all
                  ${
                    isActive(tag)
                      ? "bg-red-600 text-white border-red-600 font-semibold shadow"
                      : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
                  }`}
              >
                Sin {tag}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}



// "use client";

// import { useEffect, useState } from "react";
// import { collection, getDocs, query, where } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// const INGREDIENTES_NO_EDITABLES = [
//   "pan",
//   "medallón",
//   "medallon",
//   "carne",
//   "papas fritas",
//   "papas",
// ];

// export default function IngredientNotes({
//   productId,
//   onAddNote,
//   currentNote = "",
//   onExtrasChange,
//   onLoadingChange,
//   onConfirm,
// }) {
//   const [tags, setTags] = useState([]);
//   const [extrasFijos, setExtrasFijos] = useState([]);
//   const [extrasFijosSeleccionados, setExtrasFijosSeleccionados] = useState([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         onLoadingChange?.(true);

//         // 1. Obtener datos del producto
//         const productRes = await fetch(`/api/productsId/${productId}`);
//         if (!productRes.ok) throw new Error("No se pudo cargar el producto");
//         const productData = await productRes.json();
//         const isBurger = productData.isBurger || productData.isCombo;

//         // 2. Extras desde Firestore
//         const extrasSnap = await getDocs(
//           query(collection(db, "productExtras"), where("active", "==", true))
//         );

//         const extrasFromDB = extrasSnap.docs
//           .map((doc) => ({ id: doc.id, ...doc.data() }))
//           .filter((extra) =>
//             isBurger ? extra.productTypes?.includes("burger") : false
//           );

//         setExtrasFijos(extrasFromDB);

//         // 3. Ingredientes sugeridos
//         const [recipesRes, ingredientsRes] = await Promise.all([
//           fetch("/api/recipes"),
//           fetch("/api/ingredients"),
//         ]);

//         if (!recipesRes.ok || !ingredientsRes.ok)
//           throw new Error("No se pudo cargar recetas o ingredientes");

//         const recipes = await recipesRes.json();
//         const ingredients = await ingredientsRes.json();

//         let productosParaAnalizar = [];

//         if (productData.isCombo && Array.isArray(productData.comboItems)) {
//           productosParaAnalizar = productData.comboItems.map(
//             (item) => item.productId
//           );
//         } else {
//           productosParaAnalizar = [productId];
//         }

//         const sugeridos = new Set();

//         for (const pid of productosParaAnalizar) {
//           const recetasProducto = recipes.filter((r) => r.productId === pid);

//           for (const receta of recetasProducto) {
//             const ingrediente = ingredients.find(
//               (i) => i.id === receta.ingredientId
//             );
//             if (!ingrediente) continue;

//             const nombre = ingrediente.name.toLowerCase();
//             const esBloqueado = INGREDIENTES_NO_EDITABLES.some((base) =>
//               nombre.includes(base)
//             );

//             if (!esBloqueado) {
//               sugeridos.add(ingrediente.name);
//             }
//           }
//         }

//         setTags([...sugeridos].sort((a, b) => a.localeCompare(b)));
//       } catch (err) {
//         console.error("❌ Error en IngredientNotes:", err);
//       } finally {
//         onLoadingChange?.(false);
//       }
//     };

//     fetchData();
//   }, [productId]);

//   // Enviar extras al padre
//   useEffect(() => {
//     if (onExtrasChange) {
//       const extrasSeleccionados = extrasFijos.filter((e) =>
//         extrasFijosSeleccionados.includes(e.id)
//       );
//       onExtrasChange(extrasSeleccionados);
//     }
//   }, [extrasFijosSeleccionados]);

//   const notesArray = currentNote
//     .split(",")
//     .map((n) => n.trim())
//     .filter((n) => n.toLowerCase().startsWith("sin "));

//   const isActive = (tag) =>
//     notesArray.includes(`Sin ${tag}`) || notesArray.includes(`sin ${tag}`);

//   return (
//     <div className="flex flex-col h-full">

//       {/* CONTENIDO SCROLLEABLE */}
//       <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">

//         {/* 🔥 EXTRAS PAGOS */}
//         {extrasFijos.length > 0 && (
//           <div className="mb-4">
//             <p className="text-sm font-semibold mb-2">Agregados</p>
//             <div className="flex flex-col gap-2">
//               {extrasFijos.map((extra) => (
//                 <button
//                   key={extra.id}
//                   type="button"
//                   onClick={() => {
//                     setExtrasFijosSeleccionados((prev) =>
//                       prev.includes(extra.id)
//                         ? prev.filter((id) => id !== extra.id)
//                         : [...prev, extra.id]
//                     );
//                   }}
//                   className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-all
//                   ${
//                     extrasFijosSeleccionados.includes(extra.id)
//                       ? "bg-red-100 border-red-500 text-red-700 font-semibold"
//                       : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100"
//                   }`}
//                 >
//                   <span>{extra.name}</span>
//                   <span className="font-bold">+ ${extra.price}</span>
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* 🔧 INGREDIENTES A QUITAR */}
//         <div>
//           <p className="text-sm font-semibold mb-2">Quitar ingredientes</p>
//           <div className="flex flex-wrap gap-2">
//             {tags.length === 0 ? (
//               <span className="text-sm text-neutral-400">
//                 No hay sugerencias
//               </span>
//             ) : (
//               tags.map((tag, i) => (
//                 <button
//                   key={i}
//                   type="button"
//                   onClick={() => onAddNote(`Sin ${tag}`)}
//                   className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-all
//                   ${
//                     isActive(tag)
//                       ? "bg-red-600 text-white border-red-600 font-semibold shadow"
//                       : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
//                   }`}
//                 >
//                   Sin {tag}
//                 </button>
//               ))
//             )}
//           </div>
//         </div>
//       </div>

//       {/* 🔴 BOTÓN FIJO (siempre visible en Samsung, Xiaomi, Motorola, etc.) */}
//       <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50">
//         <button
//           onClick={onConfirm}
//           className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold text-lg"
//         >
//           Agregar
//         </button>
//       </div>
//     </div>
//   );
// }

