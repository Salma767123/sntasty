"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  Star,
  Trash2,
  ArrowRight,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

export default function WishlistClient() {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FCFCFA] pt-32">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-32 h-32 bg-[#ece0cc]/30 rounded-full flex items-center justify-center mx-auto mb-8">
            <Heart size={48} className="text-[#234d1b]/30" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-black text-[#234d1b] mb-4">
            Your Wishlist is Empty
          </h1>
          <p className="text-[#234d1b]/60 mb-8 max-w-md mx-auto">
            Start adding your favorite products to your wishlist and never lose track of what you love.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-[#234d1b] hover:bg-[#f8bf51] text-white hover:text-[#234d1b] px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Package size={20} />
            Explore Products
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFA] pt-32">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-black text-[#234d1b] mb-2">
              My Wishlist
            </h1>
            <p className="text-[#234d1b]/60">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <button
              onClick={clearWishlist}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {wishlistItems.map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                {/* Product Image */}
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-[#ece0cc]/20">
                  <Link href={`/shop/${item.slug}`}>
                    <Image
                      src={item.image || "https://via.placeholder.com/400x400?text=No+Image"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </Link>
                  
                  {/* Remove from Wishlist Button */}
                  <button
                    onClick={() => removeFromWishlist(item._id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                  >
                    <Heart size={14} fill="currentColor" />
                  </button>

                  {/* Discount Badge */}
                  {item.mrp && item.mrp > item.price && (
                    <div className="absolute top-3 left-3 bg-[#f8bf51] text-[#234d1b] px-2 py-1 rounded-lg text-xs font-bold">
                      {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-[#234d1b]/50 uppercase tracking-wider">
                      {item.category}
                    </p>
                    <Link href={`/shop/${item.slug}`}>
                      <h3 className="text-sm font-bold text-[#234d1b] line-clamp-2 hover:text-[#f8bf51] transition-colors">
                        {item.name}
                      </h3>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-[#234d1b]">
                        ₹{item.price}
                      </span>
                      {item.mrp && item.mrp > item.price && (
                        <span className="text-xs text-[#234d1b]/30 line-through">
                          ₹{item.mrp}
                        </span>
                      )}
                    </div>
                    {item.rating && (
                      <div className="flex items-center gap-1 bg-[#f8bf51]/15 px-2 py-1 rounded-full">
                        <Star size={10} className="text-[#f8bf51] fill-[#f8bf51]" />
                        <span className="text-xs font-bold text-[#234d1b]">
                          {item.rating}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => {
                      if (item.variants && item.variants.length > 0) {
                        // Find first in-stock variant or default to first
                        const bestVariant = item.variants.find(v => v.stock > 0) || item.variants[0];
                        addToCart({
                          ...item,
                          price: bestVariant.price,
                          uom: bestVariant.uom,
                        }, 1);
                      } else {
                        addToCart(item, 1);
                      }
                    }}
                    className="w-full bg-[#234d1b] hover:bg-[#f8bf51] text-white hover:text-[#234d1b] py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95"
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Continue Shopping */}
        <div className="text-center mt-12">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-[#234d1b] hover:text-[#f8bf51] font-medium transition-colors"
          >
            <ArrowRight size={16} className="rotate-180" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}