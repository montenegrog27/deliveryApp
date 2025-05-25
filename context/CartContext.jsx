"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"; // si usás uuid

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("mordisco-cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    sessionStorage.setItem("mordisco-cart", JSON.stringify(cart));
  }, [cart]);


const addItem = (item) => {
  setCart((prev) => {
    const exists = prev.find(
      (i) =>
        i.id === item.id &&
        JSON.stringify(i.attributes.extras) === JSON.stringify(item.attributes.extras) &&
        (i.attributes.note || "") === (item.attributes.note || "")
    );

    if (exists) {
      return prev.map((i) =>
        i === exists ? { ...i, quantity: i.quantity + 1 } : i
      );
    }

    return [...prev, { ...item, quantity: 1, uid: uuidv4() }];
  });
};



const decreaseItem = (id) => {
  setCart((prev) =>
    prev.map((i) =>
      i.id === id
        ? { ...i, quantity: Math.max(1, i.quantity - 1) }
        : i
    )
  );
};


const removeItem = (uid) =>
  setCart((prev) => prev.filter((i) => i.uid !== uid));
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        decreaseItem, // 👈 agregado
        removeItem,
        clearCart,
        isOpen,
        toggleCart: () => setIsOpen((v) => !v),
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
