"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { authClient } from "@/lib/auth-client";

interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  uom?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any, qty: number) => void;
  removeFromCart: (id: string, uom?: string) => void;
  updateQty: (id: string, qty: number, uom?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const isInitialLoad = useRef(true);
  const { data: session } = authClient.useSession();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("sai_nandhini_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (err) {
        console.error("Failed to parse cart", err);
      }
    }
    isInitialLoad.current = false;
  }, []);

  // Save cart to localStorage on change (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad.current) {
      localStorage.setItem("sai_nandhini_cart", JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = useCallback((product: any, qty: number) => {
    if (session?.user?.role === "admin") {
      toast.error("Admin cannot make orders");
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item._id === product._id && item.uom === product.uom,
      );
      if (existing) {
        return prev.map((item) =>
          item._id === product._id && item.uom === product.uom
            ? { ...item, qty: item.qty + qty }
            : item,
        );
      }
      return [
        ...prev,
        { ...product, qty, image: product.images?.[0] || product.image || "" },
      ];
    });

    toast.success(`${qty} item(s) added to cart!`);
  }, [session?.user?.role]);

  const removeFromCart = useCallback((id: string, uom?: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item._id === id && item.uom === uom)),
    );
  }, []);

  const updateQty = useCallback((id: string, qty: number, uom?: string) => {
    if (qty < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id && item.uom === uom ? { ...item, qty } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const cartTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.qty, 0),
    [cartItems],
  );
  const cartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.qty, 0),
    [cartItems],
  );

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      cartTotal,
      cartCount,
    }),
    [cartItems, addToCart, removeFromCart, updateQty, clearCart, cartTotal, cartCount],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
