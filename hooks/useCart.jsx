"use client";
import { useEffect, useState } from "react";

export function useCart() {
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar desde sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("mordisco-cart");
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  // Guardar en sessionStorage
  useEffect(() => {
    sessionStorage.setItem("mordisco-cart", JSON.stringify(cart));
  }, [cart]);

  const addItem = (item) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  return {
    cart,
    addItem,
    removeItem,
    clearCart,
    isOpen,
    toggleCart: () => setIsOpen((open) => !open),
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
  };
}
