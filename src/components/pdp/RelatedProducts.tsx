"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  rating: number;
  numReviews: number;
  images: string[];
  category: string;
  stock: number;
  variants?: Array<{
    uom: string;
    price: number;
    stock: number;
  }>;
}

export default function RelatedProducts({
  currentId,
  category,
  manageInventory = false,
}: {
  currentId: string;
  category?: string;
  manageInventory?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        // Build query params
        const params = new URLSearchParams({
          limit: "4",
          exclude: currentId,
        });

        // Add category filter if available
        if (category) {
          params.append("category", category);
        }

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch related products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRelatedProducts();
  }, [currentId, category]);

  if (loading) {
    return (
      <section className="py-24 border-t border-primary/5 mt-20">
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-24 border-t border-primary/5 mt-20">
      <div className="flex justify-between items-end mb-16">
        <div>
          <span className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-primary mb-4 block">
            Complete your treat
          </span>
          <h2 className="text-4xl font-serif font-black text-primary-dark tracking-tighter">
            You May Also <span className="text-brown italic">Love</span>
          </h2>
        </div>
        <Link
          href="/shop"
          className="text-xs font-sans font-black uppercase tracking-widest text-primary-dark hover:text-accent transition-colors flex items-center gap-2 group"
        >
          Browse All{" "}
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((p, i) => {
          const minPrice = p.variants?.length
            ? Math.min(...p.variants.map((v) => v.price))
            : p.price;
          const totalStock = p.variants?.length
            ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
            : p.stock || 0;
          const isOutOfStock = manageInventory && totalStock === 0;

          return (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <Link href={`/shop/${p.slug}`}>
                <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-secondary/10 mb-6 relative border border-[#234d1b]/5 shadow-lg shadow-[#234d1b]/5 group-hover:shadow-xl group-hover:shadow-[#234d1b]/10 transition-shadow duration-500">
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ShoppingCart size={48} className="text-gray-300" />
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-accent shadow-lg">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-bold">{p.rating || 5}</span>
                  </div>
                </div>
                <h3 className="text-lg font-serif font-black text-primary-dark mb-1 group-hover:text-primary transition-colors leading-tight">
                  {p.name}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="font-sans font-black text-brown">
                    ₹{minPrice}
                  </span>
                  <span className="text-[10px] font-sans font-black uppercase tracking-widest text-primary/40 group-hover:text-primary-dark transition-colors">
                    View Details
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
