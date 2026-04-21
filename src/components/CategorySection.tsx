"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { CometCard } from "@/components/ui/comet-card";

export default function CategorySection({
  initialCategories,
}: {
  initialCategories: any[];
}) {
  const [categories] = useState<any[]>(initialCategories);
  const [loading] = useState(false);

  if (loading) return null;
  if (categories.length === 0) return null;

  return (
    <section className="py-28 bg-[#ece0cc] relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f8bf51]/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#234d1b]/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#f8bf51] mb-3 block">
            Explore Our Range
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-[#234d1b] tracking-tight">
            Curated for Every{" "}
            <span className="text-[#f8bf51] italic">Taste</span>
          </h2>
          <p className="text-[#234d1b]/50 mt-4 max-w-lg mx-auto text-sm leading-relaxed font-medium">
            From tangy pickles to melt-in-your-mouth sweets — discover our
            handcrafted collection.
          </p>
          <div className="w-16 h-1 bg-[#f8bf51] rounded-full mx-auto mt-6" />
        </motion.div>

        {/* First row: 4 items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.slice(0, 4).map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              viewport={{ once: true }}
              className="h-[400px]"
            >
              <CometCard className="h-full" containerClassName="h-full">
                <Link
                  href={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className="group relative block h-full rounded-3xl overflow-hidden shadow-lg shadow-[#234d1b]/5 border border-[#234d1b]/5"
                >
                  <Image
                    src={
                      cat.image ||
                      "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=800"
                    }
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />

                  {/* Premium gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a08]/95 via-[#234d1b]/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500" />

                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.2s] pointer-events-none" />

                  <div className="absolute inset-x-0 bottom-0 p-7 z-10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f8bf51]/90 mb-2 block">
                      {cat.description || "Fresh & Authentic"}
                    </span>
                    <h3 className="text-2xl font-serif font-black text-white mb-4 leading-tight group-hover:text-[#f8bf51] transition-colors duration-300">
                      {cat.name}
                    </h3>
                    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-[#f8bf51] transition-colors bg-white/10 group-hover:bg-white/15 px-4 py-2 rounded-full backdrop-blur-sm">
                      Shop Collection{" "}
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1.5 transition-transform"
                      />
                    </span>
                  </div>
                </Link>
              </CometCard>
            </motion.div>
          ))}
        </div>

        {/* Remaining categories: dynamic grid */}
        {categories.length > 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
            {categories.slice(4).map((cat, i) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: (i + 4) * 0.08, duration: 0.5 }}
                viewport={{ once: true }}
                className="h-[400px]"
              >
                <CometCard className="h-full" containerClassName="h-full">
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat.name)}`}
                    className="group relative block h-full rounded-3xl overflow-hidden shadow-lg shadow-[#234d1b]/5 border border-[#234d1b]/5"
                  >
                    <Image
                      src={
                        cat.image ||
                        "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=800"
                      }
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a08]/95 via-[#234d1b]/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.2s] pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 p-7 z-10">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f8bf51]/90 mb-2 block">
                        {cat.description || "Fresh & Authentic"}
                      </span>
                      <h3 className="text-2xl font-serif font-black text-white mb-4 leading-tight group-hover:text-[#f8bf51] transition-colors duration-300">
                        {cat.name}
                      </h3>
                      <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-[#f8bf51] transition-colors bg-white/10 group-hover:bg-white/15 px-4 py-2 rounded-full backdrop-blur-sm">
                        Shop Collection{" "}
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1.5 transition-transform"
                        />
                      </span>
                    </div>
                  </Link>
                </CometCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
