"use client";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

export default function CartSidebar() {
  const { cart, removeItem, isOpen, closeCart } = useCart();
  const router = useRouter();

  const total = cart.reduce(
    (sum, item) => sum + item.attributes.price * item.quantity,
    0
  );

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-[#FFF9F5] z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full p-4">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-4 border-b border-neutral-200 pb-2">
          <h2 className="text-lg font-bold text-[#1A1A1A]">🛒 Tu pedido</h2>
          <button
            onClick={closeCart}
            className="text-sm text-[#E00000] font-semibold hover:underline"
          >
            Cerrar
          </button>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto space-y-5">
          {cart.length === 0 ? (
            <p className="text-neutral-500 text-sm">El carrito está vacío</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                {/* Imagen */}
                <div className="w-[72px] h-[72px] rounded-lg overflow-hidden bg-neutral-100">
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
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="text-base font-bold text-[#1A1A1A] truncate">
                    {item.attributes.name}
                  </div>
                  <div className="text-sm text-neutral-600">
                    x{item.quantity} • ${item.attributes.price}
                  </div>
                  <div className="text-sm text-neutral-700 font-medium">
                    Subtotal: ${item.attributes.price * item.quantity}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-600 mt-1 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}
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
            className="w-full bg-[#E00000] hover:bg-[#C40000] text-white py-2 rounded-full font-bold text-sm transition disabled:bg-gray-400"
          >
            Confirmar pedido
          </button>
        </div>
      </div>
    </div>
  );
}
