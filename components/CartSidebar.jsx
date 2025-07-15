"use client";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

export default function CartSidebar() {
  const [itemToRemove, setItemToRemove] = useState(null);
  const { cart, removeItem, addItem, decreaseItem, isOpen, closeCart } =
    useCart();
  const router = useRouter();

  const total = cart.reduce(
    (sum, item) => sum + item.attributes.price * item.quantity,
    0
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={closeCart} />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[90%] sm:w-96 bg-[#FFF9F5] z-50 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Encabezado */}
          <div className="flex justify-between items-center mb-4 border-b border-neutral-200 pb-2">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Tu pedido</h2>
            <button
              onClick={closeCart}
              className="text-md bg-[#E00000] text-white px-3 py-2 rounded-xl font-semibold hover:underline"
            >
              Cerrar
            </button>
          </div>

          {/* Lista de productos */}
          <div className="flex-1 overflow-y-auto space-y-5">
            <AnimatePresence>
              {cart.length === 0 ? (
                <p className="text-neutral-500 text-sm">
                  El carrito está vacío
                </p>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.uid}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-3 items-center"
                  >
                    {/* Imagen */}
                    <div className="w-[70px] h-[52px] rounded-lg overflow-hidden bg-neutral-100">
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

                    {/* Detalles */}
                    <div className="flex flex-row items-center justify-between gap-3 w-full">
                      <div className="flex-1 min-w-0">
                        {/* <div className="text-base font-bold text-[#1A1A1A] truncate"> */}
                        <div className="text-base font-bold text-[#1A1A1A] leading-tight max-w-[150px] break-words line-clamp-2">
                          {item.attributes.name}
                        </div>

                        {/* Extras */}
                        {item.attributes.extras && (
                          <div className="text-xs text-neutral-500 mt-0.5 leading-tight space-y-0.5">
                            {/* Bebida */}
                            {item.attributes.extras.drink &&
                              item.attributes.extras.drink.name && (
                                <div>
                                  • 🥤 {item.attributes.extras.drink.name}
                                </div>
                              )}

                            {/* Papas fritas */}
                            {item.attributes.extras.fries && (
                              <div>• 🍟 Papas fritas</div>
                            )}
                          </div>
                        )}

                        {/* Observaciones */}
                        {item.attributes.note && (
                          <div className="text-xs italic text-neutral-400 mt-0.5">
                            “{item.attributes.note}”
                          </div>
                        )}
                      </div>

                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => decreaseItem(item.id)}
                          disabled={item.quantity === 1}
                          className={`w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center transition-transform shadow-sm border
      ${
        item.quantity === 1
          ? "bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200"
          : "bg-white text-black hover:scale-105 border-neutral-300"
      }`}
                        >
                          –
                        </button>

                        <AnimatePresence mode="wait">
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-base font-semibold w-6 text-center"
                          >
                            {item.quantity}
                          </motion.span>
                        </AnimatePresence>

                        <button
                          onClick={() => addItem(item)}
                          className="w-8 h-8 rounded-full bg-white text-black text-lg font-bold hover:scale-105 flex items-center justify-center transition-transform border border-neutral-300 shadow-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Botón Quitar */}
                      <button
                        onClick={() => setItemToRemove(item.uid)}
                        className="text-xs rounded-full bg-red-500 px-2 py-2 text-white font-bold hover:underline ml-2"
                        title="Quitar"
                      >
                        <X />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Total y confirmación */}
          <div className="mt-6 border-t border-neutral-200 pt-4 space-y-4">
            <div className="flex justify-between font-semibold text-[#1A1A1A]">
              <span>Total:</span>
              <span>${total}</span>
            </div>
            <button
              disabled={cart.length === 0}
              onClick={() => {
                closeCart();
                router.push("/checkout");
              }}
              className="w-full  bg-[#E00000] hover:bg-[#C40000] text-white py-4 rounded-full font-bold text-md transition disabled:bg-gray-400"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      <AnimatePresence>
        {itemToRemove && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-[90%] max-w-sm rounded-xl p-5 text-center shadow-xl"
            >
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                ¿Eliminar este ítem?
              </h3>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setItemToRemove(null)}
                  className="bg-neutral-200 hover:bg-neutral-300 text-black px-12 py-3 rounded-2xl font-semibold text-sm"
                >
                  No
                </button>
                <button
                  onClick={() => {
                    removeItem(itemToRemove);
                    setItemToRemove(null);
                  }}
                  className="bg-[#E00000] hover:bg-[#C40000] text-white px-12 py-3 rounded-2xl font-semibold text-sm"
                >
                  Sí
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
