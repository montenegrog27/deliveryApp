"use client";
import { useCart } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { addItem, toggleCart } = useCart();

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/menu");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setMenu(data);
      } catch (err) {
        console.error("❌ Error al obtener el menú:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF2E7] to-[#FFE9D6] font-inter text-[#1A1A1A]">
      {/* HEADER */}
      <header className="bg-[#1A1A1A] px-6 py-4 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <img
          src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1744755147/Versi%C3%B3n_principal_xer7zs.svg"
          alt="MORDISCO"
          className="h-8"
        />
        <button
          onClick={toggleCart}
          className="bg-[#E00000] hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          Mi pedido
        </button>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-16 scroll-smooth">
        <h2 className="text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-6 text-center">
          Elegí tu mordisco 🍔
        </h2>

        {loading ? (
          <p className="text-gray-600 text-center">Cargando productos...</p>
        ) : (
          menu
            .slice()
            .sort((a, b) => (a.inOrder ?? 0) - (b.inOrder ?? 0))
            .map((cat) => {
              const availableItems =
                cat.items?.filter((item) => item.attributes?.available) || [];

              if (availableItems.length === 0) return null;

              return (
                <section key={cat.id} id={`cat-${cat.id}`} className="space-y-6">
                  <h3 className="text-3xl font-bold text-[#E00000]">{cat.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {availableItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl border border-neutral-200 transition-all"
                      >
                        {item.attributes.image ? (
                          <img
                            src={item.attributes.image}
                            alt={item.attributes.name}
                            className="w-full h-64 object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-64 bg-neutral-100 flex items-center justify-center text-sm text-neutral-400">
                            Sin imagen
                          </div>
                        )}

                        <div className="p-6 flex flex-col gap-4">
                          <div>
                            <h4 className="text-xl font-extrabold text-[#1A1A1A]">
                              {item.attributes.name}
                            </h4>
                            {item.attributes.description && (
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                {item.attributes.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#E00000] font-bold text-lg">
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
                </section>
              );
            })
        )}
      </main>

      <CartSidebar />
    </div>
  );
}
