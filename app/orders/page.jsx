"use client";
import { useCart } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { addItem, toggleCart, cart } = useCart();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bump, setBump] = useState(false);

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

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleAdd = (item) => {
    addItem(item);
    setBump(true);
    setTimeout(() => setBump(false), 300);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] font-inter text-[#1A1A1A]">
      {/* HEADER */}
      <header className="bg-[#FFF9F5]/90 backdrop-blur-md sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-neutral-200">
        <img
          src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1744755147/Versi%C3%B3n_principal_xer7zs.svg"
          alt="MORDISCO"
          className="h-8"
        />
        <button
          onClick={toggleCart}
          className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-[#E00000] text-white text-sm font-bold transition hover:scale-105"
        >
          <span>Mi pedido</span>
          {totalItems > 0 && (
            <span className="bg-white text-[#E00000] rounded-full px-2 py-0.5 text-xs font-bold">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-16">
        {loading ? (
          <p className="text-center text-gray-500 mt-12">Cargando productos...</p>
        ) : (
          menu
            .slice()
            .sort((a, b) => (a.inOrder ?? 0) - (b.inOrder ?? 0))
            .map((cat) => {
              const availableItems =
                cat.items?.filter((item) => item.attributes?.available) || [];
              if (availableItems.length === 0) return null;

              return (
                <section key={cat.id} className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#E00000]">{cat.name}</h2>
                  <ul className="space-y-4">
                    {availableItems.map((item) => (
                      <li key={item.id} className="flex gap-4 items-center">
                        {/* Imagen a la izquierda */}
                        <div className="w-[96px] h-[96px] flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          {item.attributes.image ? (
                            <img
                              src={item.attributes.image}
                              alt={item.attributes.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-neutral-400">
                              Sin imagen
                            </div>
                          )}
                        </div>

                        {/* Info en el centro */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <h3 className="text-base font-bold text-[#1A1A1A] truncate">
                            {item.attributes.name}
                          </h3>
                          {item.attributes.description && (
                            <p className="text-sm text-neutral-600 leading-tight line-clamp-2">
                              {item.attributes.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[#E00000] font-bold text-sm">
                              ${item.attributes.discountPrice || item.attributes.price}
                            </span>
                            <button
                              onClick={() => handleAdd(item)}
                              className={`text-sm font-semibold text-white bg-[#E00000] hover:bg-[#C40000] px-4 py-1.5 rounded-full transition-all duration-200 ${
                                bump ? "animate-bounce-sm" : ""
                              }`}
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
        )}
      </main>

      <CartSidebar />
    </div>
  );
}
