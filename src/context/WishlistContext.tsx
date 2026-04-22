"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { authClient } from "@/lib/auth-client";

interface WishlistItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number;
  image: string;
  category: string;
  rating?: number;
  stock?: number;
  variants?: Array<{
    uom: string;
    price: number;
    stock: number;
  }>;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: any) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const isInitialLoad = useRef(true);
  const { data: session } = authClient.useSession();

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem("sai_nandhini_wishlist");
    if (savedWishlist) {
      try {
        setWishlistItems(JSON.parse(savedWishlist));
      } catch (err) {
        console.error("Failed to parse wishlist", err);
      }
    }
    isInitialLoad.current = false;
  }, []);

  // Save wishlist to localStorage on change (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad.current) {
      localStorage.setItem("sai_nandhini_wishlist", JSON.stringify(wishlistItems));
    }
  }, [wishlistItems]);

  const addToWishlist = (product: any) => {
    if ((session?.user as any)?.role === "admin") {
      toast.error("Admin cannot use wishlist");
      return;
    }

    const existing = wishlistItems.find((item) => item._id === product._id);
    if (existing) {
      toast.error("Already in wishlist!");
      return;
    }

    const wishlistItem: WishlistItem = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      mrp: product.mrp,
      image: product.images?.[0] || "",
      category: product.category,
      rating: product.rating,
      stock: product.stock,
      variants: product.variants,
    };

    setWishlistItems((prev) => [...prev, wishlistItem]);
    toast.success("Added to wishlist!");
  };

  const removeFromWishlist = (id: string) => {
    setWishlistItems((prev) => prev.filter((item) => item._id !== id));
    toast.success("Removed from wishlist");
  };

  const isInWishlist = (id: string) => {
    return wishlistItems.some((item) => item._id === id);
  };

  const clearWishlist = () => {
    setWishlistItems([]);
    toast.success("Wishlist cleared");
  };

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}