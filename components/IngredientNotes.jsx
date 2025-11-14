// import { useEffect, useState } from "react";

// const INGREDIENTES_NO_EDITABLES = ["pan", "medallón", "medallon", "carne", "papas fritas", "papas"];

// export default function IngredientNotes({
//   productId,
//   onAddNote,
//   currentNote = "",
//   onExtrasChange,
// }) {
//   const [tags, setTags] = useState([]);
//   const [extrasFijos, setExtrasFijos] = useState([]);
//   const [extrasFijosSeleccionados, setExtrasFijosSeleccionados] = useState([]);
//   const [bebidas, setBebidas] = useState([]);
//   const [bebidaSeleccionada, setBebidaSeleccionada] = useState(null);

// useEffect(() => {
//   const fetchIngredientes = async () => {
//     try {
//       const bebidasRes = await fetch(`/api/categories/8gCfPmbkpDGt1ih3FUkL`);
//       if (bebidasRes.ok) {
//         const bebidasData = await bebidasRes.json();
//         setBebidas(bebidasData.items || []);
//       } else {
//         console.warn("⚠️ No se pudieron cargar las bebidas");
//       }
//     } catch (err) {
//       console.error("❌ Error al cargar bebidas:", err);
//     }

//     try {
//       const [recipesRes, ingredientsRes, productDocRes] = await Promise.all([
//         fetch("/api/recipes"),
//         fetch("/api/ingredients"),
//         fetch(`/api/productsId/${productId}`),
//       ]);

//       if (!recipesRes.ok || !ingredientsRes.ok || !productDocRes.ok)
//         throw new Error("Error al cargar datos");

//       const recipes = await recipesRes.json();
//       const ingredients = await ingredientsRes.json();
//       const productData = await productDocRes.json();

//       let productosParaAnalizar = [];

//       if (productData.isCombo && Array.isArray(productData.comboItems)) {
//         productosParaAnalizar = productData.comboItems.map(
//           (item) => item.productId
//         );
//       } else {
//         productosParaAnalizar = [productId];
//       }

//       const tieneCheddar = ingredients.some(
//         (i) =>
//           i.name.toLowerCase().includes("cheddar") &&
//           recipes.some(
//             (r) =>
//               productosParaAnalizar.includes(r.productId) &&
//               r.ingredientId === i.id
//           )
//       );

//       const tieneDanbo = ingredients.some(
//         (i) =>
//           i.name.toLowerCase().includes("danbo") &&
//           recipes.some(
//             (r) =>
//               productosParaAnalizar.includes(r.productId) &&
//               r.ingredientId === i.id
//           )
//       );

//       const extras = [
//         { id: "extra_medallon", name: "Medallón extra", price: 1500 },
//         { id: "extra_mayonesa", name: "Mayonesa extra", price: 150 },
//       ];

//       if (tieneCheddar) {
//         extras.push({
//           id: "extra_queso_cheddar",
//           name: "Queso cheddar extra",
//           price: 600,
//         });
//       } else if (tieneDanbo) {
//         extras.push({
//           id: "extra_queso_danbo",
//           name: "Queso danbo extra",
//           price: 300,
//         });
//       }

//       setExtrasFijos(extras);

//       // ingredientes para quitar (sugeridos)
//       const sugeridos = new Set();

//       for (const pid of productosParaAnalizar) {
//         const recetasProducto = recipes.filter((r) => r.productId === pid);
//         for (const receta of recetasProducto) {
//           const ingrediente = ingredients.find(
//             (i) => i.id === receta.ingredientId
//           );
//           if (!ingrediente) continue;

//           const nombre = ingrediente.name.toLowerCase();
//           const esBloqueado = INGREDIENTES_NO_EDITABLES.some((base) =>
//             nombre.includes(base)
//           );

//           if (!esBloqueado) {
//             sugeridos.add(ingrediente.name);
//           }
//         }
//       }

//       setTags([...sugeridos].sort((a, b) => a.localeCompare(b)));
//     } catch (error) {
//       console.error("❌ Error al cargar ingredientes:", error);
//     }
//   };

//   if (productId) fetchIngredientes();
// }, [productId]);


//   // 🔁 Enviar cambios al padre
//   useEffect(() => {
//     if (onExtrasChange) {
//       const extrasSeleccionados = extrasFijos.filter((e) =>
//         extrasFijosSeleccionados.includes(e.id)
//       );

//       const allExtras = [...extrasSeleccionados];
//       if (bebidaSeleccionada) {
//         allExtras.push({
//           id: bebidaSeleccionada.id,
//           name: bebidaSeleccionada.attributes.name,
//           price: bebidaSeleccionada.attributes.price,
//         });
//       }

//       onExtrasChange(allExtras);
//     }
//   }, [extrasFijosSeleccionados, bebidaSeleccionada]);

//   const notesArray = currentNote
//     .split(",")
//     .map((n) => n.trim())
//     .filter((n) => n.toLowerCase().startsWith("sin "));

//   const isActive = (tag) =>
//     notesArray.includes(`Sin ${tag}`) || notesArray.includes(`sin ${tag}`);

//   return (
//     <div className="flex flex-wrap gap-2 mt-3 w-full">
//       {/* Ingredientes para quitar */}
//       {tags.length === 0 ? (
//         <span className="text-sm text-neutral-400">No hay sugerencias</span>
//       ) : (
//         tags.map((tag, i) => (
//           <button
//             key={i}
//             type="button"
//             onClick={() => onAddNote(`Sin ${tag}`)}
//             className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-all ${
//               isActive(tag)
//                 ? "bg-red-600 text-white border-red-600 font-semibold shadow"
//                 : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
//             }`}
//           >
//             Sin {tag}
//           </button>
//         ))
//       )}
//     </div>
//   );
// }

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
