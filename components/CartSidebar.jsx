"use client";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import AddressInput from "@/components/AddressInput";
import { useRouter } from "next/navigation";

export default function CartSidebar() {
  const { cart, removeItem, clearCart, isOpen, closeCart } = useCart();
  const router = useRouter();

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    lat: null,
    lng: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const total = cart.reduce(
    (sum, item) => sum + item.attributes.price * item.quantity,
    0
  );

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          cart,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      setSuccess(true);
      clearCart();
      setTimeout(() => {
        closeCart();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError("Hubo un error al confirmar el pedido.");
      console.error("❌", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-lg z-50 transform transition-transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🛒 Tu pedido</h2>
          <button onClick={closeCart} className="text-sm text-gray-500">
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Carrito */}
          {cart.length === 0 ? (
            <p className="text-gray-500">El carrito está vacío</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="border p-3 rounded-lg">
                <div className="font-semibold">{item.attributes.name}</div>
                <div className="text-sm text-gray-600">
                  x{item.quantity} • ${item.attributes.price}
                </div>
                <div className="text-sm text-gray-800">
                  Subtotal: ${item.attributes.price * item.quantity}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 text-xs mt-1"
                >
                  Quitar
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>${total}</span>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => {
              closeCart();
              router.push("/checkout");
            }}
            className="mt-4 w-full bg-[#E00000] text-white py-2 rounded-xl font-semibold disabled:bg-gray-400"
          >
            Confirmar pedido
          </button>
        </div>
      </div>
    </div>
  );
}
