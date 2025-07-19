import { useEffect, useState } from "react";

const INGREDIENTES_NO_EDITABLES = ["pan", "medallón", "medallon", "carne"];

export default function IngredientNotes({ productId, onAddNote }) {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchIngredientes = async () => {
      try {
        console.log("🔍 Buscando ingredientes para producto:", productId);

        const [recipesRes, ingredientsRes] = await Promise.all([
          fetch("/api/recipes"),
          fetch("/api/ingredients"),
        ]);

        if (!recipesRes.ok || !ingredientsRes.ok) {
          throw new Error("Error al cargar datos desde el servidor");
        }

        const recipes = await recipesRes.json();
        const ingredients = await ingredientsRes.json();

        // Filtrar recetas asociadas al producto
        const recetasProducto = recipes.filter(
          (r) => r.productId === productId
        );

        if (recetasProducto.length === 0) {
          console.warn("⚠️ No se encontraron recetas para este producto.");
          return;
        }

        const ingredientesSugeridos = [];

        for (const receta of recetasProducto) {
          const ingrediente = ingredients.find((i) => i.id === receta.ingredientId);
          if (!ingrediente) {
            console.warn("❌ Ingrediente no encontrado:", receta.ingredientId);
            continue;
          }

          const nombre = ingrediente.name.toLowerCase();
          const esBloqueado = INGREDIENTES_NO_EDITABLES.some((base) =>
            nombre.includes(base)
          );

          if (!esBloqueado) {
            ingredientesSugeridos.push(ingrediente.name);
            console.log("✅ Ingrediente agregado:", ingrediente.name);
          } else {
            console.log("🚫 Ingrediente bloqueado:", ingrediente.name);
          }
        }

        setTags(ingredientesSugeridos.sort((a, b) => a.localeCompare(b)));
      } catch (error) {
        console.error("❌ Error al cargar ingredientes:", error);
      }
    };

    if (productId) fetchIngredientes();
  }, [productId]);

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {tags.length === 0 ? (
        <span className="text-sm text-neutral-400">No hay sugerencias</span>
      ) : (
        tags.map((tag, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAddNote(`Sin ${tag}`)}
            className="bg-neutral-200 hover:bg-neutral-300 text-sm px-3 py-1 rounded-full"
          >
            Sin {tag}
          </button>
        ))
      )}
    </div>
  );
}
