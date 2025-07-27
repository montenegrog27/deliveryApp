import { CheckCircle, Circle } from "lucide-react";
import { useEffect, useState } from "react";

const INGREDIENTES_NO_EDITABLES = ["pan", "medallón", "medallon", "carne", "papas fritas", "papas"];

export default function IngredientNotes({
  productId,
  onAddNote,
  currentNote = "",
  onExtrasChange,
}) {
  const [tags, setTags] = useState([]);
  const [extrasFijos, setExtrasFijos] = useState([]);
  const [extrasFijosSeleccionados, setExtrasFijosSeleccionados] = useState([]);
  const [bebidas, setBebidas] = useState([]);
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState(null);

useEffect(() => {
  const fetchIngredientes = async () => {
    try {
      const bebidasRes = await fetch(`/api/categories/8gCfPmbkpDGt1ih3FUkL`);
      if (bebidasRes.ok) {
        const bebidasData = await bebidasRes.json();
        setBebidas(bebidasData.items || []);
      } else {
        console.warn("⚠️ No se pudieron cargar las bebidas");
      }
    } catch (err) {
      console.error("❌ Error al cargar bebidas:", err);
    }

    try {
      const [recipesRes, ingredientsRes, productDocRes] = await Promise.all([
        fetch("/api/recipes"),
        fetch("/api/ingredients"),
        fetch(`/api/productsId/${productId}`),
      ]);

      if (!recipesRes.ok || !ingredientsRes.ok || !productDocRes.ok)
        throw new Error("Error al cargar datos");

      const recipes = await recipesRes.json();
      const ingredients = await ingredientsRes.json();
      const productData = await productDocRes.json();

      let productosParaAnalizar = [];

      if (productData.isCombo && Array.isArray(productData.comboItems)) {
        productosParaAnalizar = productData.comboItems.map(
          (item) => item.productId
        );
      } else {
        productosParaAnalizar = [productId];
      }

      const tieneCheddar = ingredients.some(
        (i) =>
          i.name.toLowerCase().includes("cheddar") &&
          recipes.some(
            (r) =>
              productosParaAnalizar.includes(r.productId) &&
              r.ingredientId === i.id
          )
      );

      const tieneDanbo = ingredients.some(
        (i) =>
          i.name.toLowerCase().includes("danbo") &&
          recipes.some(
            (r) =>
              productosParaAnalizar.includes(r.productId) &&
              r.ingredientId === i.id
          )
      );

      const extras = [
        { id: "extra_medallon", name: "Medallón extra", price: 1500 },
        { id: "extra_mayonesa", name: "Mayonesa extra", price: 150 },
      ];

      if (tieneCheddar) {
        extras.push({
          id: "extra_queso_cheddar",
          name: "Queso cheddar extra",
          price: 600,
        });
      } else if (tieneDanbo) {
        extras.push({
          id: "extra_queso_danbo",
          name: "Queso danbo extra",
          price: 300,
        });
      }

      setExtrasFijos(extras);

      // ingredientes para quitar (sugeridos)
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
    } catch (error) {
      console.error("❌ Error al cargar ingredientes:", error);
    }
  };

  if (productId) fetchIngredientes();
}, [productId]);


  // 🔁 Enviar cambios al padre
  useEffect(() => {
    if (onExtrasChange) {
      const extrasSeleccionados = extrasFijos.filter((e) =>
        extrasFijosSeleccionados.includes(e.id)
      );

      const allExtras = [...extrasSeleccionados];
      if (bebidaSeleccionada) {
        allExtras.push({
          id: bebidaSeleccionada.id,
          name: bebidaSeleccionada.attributes.name,
          price: bebidaSeleccionada.attributes.price,
        });
      }

      onExtrasChange(allExtras);
    }
  }, [extrasFijosSeleccionados, bebidaSeleccionada]);

  const notesArray = currentNote
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n.toLowerCase().startsWith("sin "));

  const isActive = (tag) =>
    notesArray.includes(`Sin ${tag}`) || notesArray.includes(`sin ${tag}`);

  return (
    <div className="flex flex-wrap gap-2 mt-3 w-full">
      {/* Ingredientes para quitar */}
      {tags.length === 0 ? (
        <span className="text-sm text-neutral-400">No hay sugerencias</span>
      ) : (
        tags.map((tag, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAddNote(`Sin ${tag}`)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-all ${
              isActive(tag)
                ? "bg-red-600 text-white border-red-600 font-semibold shadow"
                : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
            }`}
          >
            Sin {tag}
          </button>
        ))
      )}

      {/* Extras fijos */}
      {/* <div className="w-full mt-6">
        <p className="text-sm font-medium text-[#1A1A1A] mb-2">Agregar extras</p>
        <div className="flex flex-wrap gap-2">
          {extrasFijos.map((extra) => {
            const isSelected = extrasFijosSeleccionados.includes(extra.id);
            return (
              <button
                key={extra.id}
                type="button"
                onClick={() => {
                  setExtrasFijosSeleccionados((prev) =>
                    isSelected
                      ? prev.filter((id) => id !== extra.id)
                      : [...prev, extra.id]
                  );
                }}
                className={`flex items-center gap-3 p-3 rounded-lg border w-full sm:w-auto sm:min-w-[200px] justify-between transition-all ${
                  isSelected
                    ? "bg-green-50 border-green-500 text-green-800 font-semibold shadow"
                    : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-sm">{extra.name}</span>
                  <span className="text-xs font-semibold text-neutral-500">
                    +${extra.price}
                  </span>
                </div>
                {isSelected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-neutral-400" />
                )}
              </button>
            );
          })}
        </div>
      </div> */}

      {/* Dropdown bebidas */}
      {/* {bebidas.length > 0 && (
        <div className="w-full mt-6">
          <p className="text-sm font-medium text-[#1A1A1A] mb-2">
            Agregar bebida
          </p>
          <select
            className="w-full border rounded p-2 text-sm text-neutral-700"
            value={bebidaSeleccionada?.id || ""}
            onChange={(e) => {
              const selected = bebidas.find((b) => b.id === e.target.value);
              setBebidaSeleccionada(selected || null);
            }}
          >
            <option value="">Selecciona una bebida</option>
            {bebidas.map((bebida) => (
              <option key={bebida.id} value={bebida.id}>
                {bebida.attributes.name} - ${bebida.attributes.price}
              </option>
            ))}
          </select>
        </div>
      )} */}
    </div>
  );
}
