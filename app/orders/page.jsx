"use client";
import { useCart } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const { addItem, toggleCart, cart } = useCart();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [note, setNote] = useState("");
  const [selectedDrinkId, setSelectedDrinkId] = useState("");
  const [includeFries, setIncludeFries] = useState(false);
  const [showDrinkDropdown, setShowDrinkDropdown] = useState(false);

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

  const drinksCategory = menu.find((cat) => cat.name === "Bebidas");
  const friesProduct = menu.find((cat) => cat.name === "Papas fritas")
    ?.items?.[0];
  const selectedDrink =
    drinksCategory?.items.find((item) => item.id === selectedDrinkId) || null;

  const finalPrice =
    (selectedItem?.attributes.discountPrice ||
      selectedItem?.attributes.price ||
      0) +
    (selectedDrink?.attributes?.price || 0) +
    (includeFries ? friesProduct?.attributes?.price || 0 : 0);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

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
          <div className="flex flex-col items-center justify-center mt-50">
            <motion.img
              src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1744757019/Recurso_40_zti0fq.svg"
              alt="MORDISCO"
              className="h-36 w-auto"
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: 2,
              }}
            />
          </div>
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
                  <h2 className="text-2xl font-bold text-[#E00000]">
                    {cat.name}
                  </h2>
                  <ul className="space-y-4">
                    {availableItems.map((item) => (
                      <li key={item.id} className="flex gap-4 items-center">
                        <div className="w-[96px] h-[96px] rounded-lg overflow-hidden bg-neutral-100">
                          {item.attributes.image ? (
                            <img
                              src={item.attributes.image}
                              alt={item.attributes.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-sm text-neutral-400">
                              Sin imagen
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <h3 className="text-base font-bold text-[#1A1A1A] truncate">
                            {item.attributes.name}
                          </h3>
                          {item.attributes.description && (
                            <p className="text-sm text-neutral-600 line-clamp-2">
                              {item.attributes.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[#E00000] font-bold text-sm">
                              $
                              {item.attributes.discountPrice ||
                                item.attributes.price}
                            </span>
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="text-sm font-semibold text-white bg-[#E00000] hover:bg-[#C40000] px-4 py-1.5 rounded-full transition-all"
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

      {/* MODAL DE EXTRAS */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            key="add-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl space-y-4 text-left"
            >
              <h3 className="text-xl font-bold text-[#1A1A1A]">
                {selectedItem.attributes.name}
              </h3>

              {selectedItem.attributes.description && (
                <p className="text-sm text-neutral-600">
                  {selectedItem.attributes.description}
                </p>
              )}

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium mt-5 mb-1 text-[#1A1A1A]">
                  Observaciones
                </label>
                <textarea
                  className="w-full border rounded p-2 text-base"
                  placeholder="Ej: sin lechuga, sin tomate.."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>


              {/* Total */}
              <div className="text-right text-sm font-semibold text-[#1A1A1A]">
                Total: ${finalPrice}
              </div>

              {/* Botones */}
              <div className="space-y-2">
                <div className="w-full flex justify-center items-center">
                <button
                  onClick={() => {
                    const extras = {
                      drink: selectedDrink
                        ? {
                            id: selectedDrink.id,
                            name: selectedDrink.attributes.name,
                            price: selectedDrink.attributes.price,
                          }
                        : null,
                      fries: includeFries,
                    };
                    addItem({
                      ...selectedItem,
                      attributes: {
                        ...selectedItem.attributes,
                        price: finalPrice,
                        note,
                        extras,
                      },
                    });
                    setSelectedItem(null);
                    setNote("");
                    setSelectedDrinkId("");
                    setIncludeFries(false);
                    setShowDrinkDropdown(false);
                  }}
                  className="w-[50%] bg-[#E00000] hover:bg-[#C40000] text-white py-3 rounded-full font-bold text-sm"
                >
                  Agregar al pedido
                </button>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setNote("");
                    setSelectedDrinkId("");
                    setIncludeFries(false);
                    setShowDrinkDropdown(false);
                  }}
                  className="w-full text-sm text-neutral-500 text-center"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
