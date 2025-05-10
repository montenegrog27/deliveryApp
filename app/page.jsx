"use client";
import { useCart } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { addItem, toggleCart } = useCart();

  const [menu, setMenu] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/menu");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setMenu(data);
        if (data.length > 0) setSelectedCategoryId(data[0].id); // seleccionar primero por defecto
      } catch (err) {
        console.error("❌ Error al obtener el menú:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const selectedCategory = menu.find((cat) => cat.id === selectedCategoryId);
  const activeItems =
    selectedCategory?.items?.filter((item) => item.attributes?.available) || [];

  return (
    <div className="min-h-screen bg-[#FFF2E7] font-inter text-[#1A1A1A]">
      {/* HEADER */}
      <header className="bg-[#1A1A1A] px-6 py-4 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1744755147/Versi%C3%B3n_principal_xer7zs.svg"
            alt="MORDISCO"
            className="h-8"
          />
        </div>
        <button
          onClick={toggleCart}
          className="bg-[#E00000] hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          Mi pedido
        </button>
      </header>

      {/* CONTENIDO */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-4xl font-extrabold mb-10 text-[#1A1A1A] tracking-tight">
          Elegí tu mordisco
        </h2>

        {menu
          .slice() // para no mutar el original
          .sort((a, b) => (a.inOrder ?? 0) - (b.inOrder ?? 0))
          .map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                selectedCategoryId === cat.id
                  ? "bg-[#E00000] text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {cat.name}
            </button>
          ))}

        {/* Productos */}
        {loading ? (
          <p className="text-gray-600">Cargando productos...</p>
        ) : activeItems.length === 0 ? (
          <p className="text-gray-500">
            No hay productos disponibles en esta categoría.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg border border-neutral-200 transition-all"
              >
                {item.attributes.image ? (
                  <img
                    src={item.attributes.image}
                    alt={item.attributes.name}
                    className="w-full md:w-1/2 h-72 object-cover"
                  />
                ) : (
                  <div className="w-full md:w-1/2 h-72 bg-neutral-100 flex items-center justify-center text-sm text-neutral-400">
                    Sin imagen
                  </div>
                )}

                <div className="w-full md:w-1/2 p-6 flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-2xl font-extrabold text-[#1A1A1A]">
                      {item.attributes.name}
                    </h4>
                    {item.attributes.description && (
                      <p className="text-base text-gray-500 mt-2 leading-snug">
                        {item.attributes.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[#E00000] font-bold text-xl">
                      ${item.attributes.discountPrice || item.attributes.price}
                    </span>
                    <button
                      onClick={() => addItem(item)}
                      className="bg-[#E00000] hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <CartSidebar />
    </div>
  );
}
