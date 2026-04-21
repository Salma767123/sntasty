"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star, ShoppingBag, ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useState } from "react";

export default function FeaturedProducts({
  initialProducts,
}: {
  initialProducts: any[];
}) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [products] = useState<any[]>(initialProducts);
  const [loading] = useState(false);

  if (loading)
    return (
      <section className="py-24 bg-white flex justify-center">
        <div className="w-8 h-8 border-4 border-[#f8bf51] border-t-transparent rounded-full animate-spin"></div>
      </section>
    );

  if (products.length === 0) return null;

  return (
    <section className="py-28 bg-white relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#f8bf51]/[0.03] rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#234d1b]/[0.03] rounded-full blur-[100px] translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#f8bf51] mb-3 block">
              Customer Favourites
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-[#234d1b] tracking-tight">
              Bestsellers
            </h2>
            <div className="w-16 h-1 bg-[#f8bf51] rounded-full mt-4" />
          </div>
          <Link
            href="/shop"
            className="group flex items-center gap-2.5 text-sm font-bold text-[#234d1b] hover:text-[#f8bf51] transition-colors bg-[#234d1b]/5 hover:bg-[#f8bf51]/10 px-5 py-3 rounded-xl"
          >
            View All Products{" "}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col h-full group"
            >
              <Link href={`/shop/${product.slug}`} className="flex flex-col h-full">
                {/* Image Container */}
                <div className="relative rounded-2xl overflow-hidden bg-[#ece0cc]/60 aspect-square mb-4 border border-[#234d1b]/5 group-hover:shadow-xl group-hover:shadow-[#234d1b]/8 transition-all duration-500">
                  <Image
                    src={
                      product.images && product.images[0]
                        ? product.images[0]
                        : "https://via.placeholder.com/400x400?text=No+Image"
                    }
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />

                  {product.tag && (
                    <div className="absolute top-3 left-3 bg-[#234d1b] text-white px-3.5 py-1.5 rounded-full shadow-lg">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {product.tag}
                      </span>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {product.mrp && product.mrp > product.price && (
                    <div className="absolute top-3 right-3 bg-[#f8bf51] text-[#234d1b] px-2.5 py-1 rounded-full shadow-lg">
                      <span className="text-[10px] font-bold">
                        {Math.round(
                          ((product.mrp - product.price) / product.mrp) * 100,
                        )}
                        % OFF
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (isInWishlist(product._id)) {
                        removeFromWishlist(product._id);
                      } else {
                        addToWishlist(product);
                      }
                    }}
                    className={`absolute top-3 ${product.mrp && product.mrp > product.price ? 'left-3' : 'right-3'} w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 ${
                      isInWishlist(product._id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/90 backdrop-blur-sm text-[#234d1b] hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Heart size={14} fill={isInWishlist(product._id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Product Info */}
                <div className="flex flex-col flex-grow px-1">
                  <h3 className="text-base font-bold text-[#234d1b] leading-snug line-clamp-2 group-hover:text-[#f8bf51] transition-colors duration-300 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-black text-[#234d1b]">
                      ₹{product.price}
                    </span>
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-xs text-[#234d1b]/30 line-through font-medium">
                        ₹{product.mrp}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              
              {/* Add to Cart Button - Outside Link to prevent nested links */}
              <div className="px-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart(product, 1);
                  }}
                  className="w-full bg-[#234d1b] hover:bg-[#f8bf51] text-white hover:text-[#234d1b] py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95"
                >
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
