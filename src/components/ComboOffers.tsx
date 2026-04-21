"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, Percent, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

export default function ComboOffers({
  initialCombos,
}: {
  initialCombos: any[];
}) {
  const [combos] = useState<any[]>(initialCombos);
  const [loading] = useState(false);
  const { addToCart } = useCart();

  if (loading) return null;
  if (combos.length === 0) return null;

  return (
    <section className="py-32 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <span className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-brown mb-4 block">
              Limited Time Bundles
            </span>
            <h2 className="text-4xl md:text-6xl font-serif font-black text-primary-dark tracking-tighter">
              Combo{" "}
              <span className="text-brown italic italic-font relative inline-block">
                Masterpieces
                <svg
                  className="absolute -bottom-2 left-0 w-full text-secondary/50 -z-10"
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 10 Q 50 20, 100 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
              </span>
            </h2>
          </div>
          <p className="text-primary/60 font-sans font-medium max-w-sm">
            Save up to 25% when you buy our curated gift boxes and daily
            bundles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {combos.map((combo, i) => (
            <motion.div
              key={combo._id}
              initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`${i % 2 === 0 ? "bg-secondary/10" : "bg-primary/5"} rounded-[3rem] p-4 md:p-8 flex flex-col md:flex-row gap-8 items-center border border-[#234d1b]/5 shadow-xl shadow-[#234d1b]/5 hover:shadow-2xl hover:shadow-[#234d1b]/10 transition-all group`}
            >
              <div className="w-full md:w-60 h-60 rounded-[2.5rem] overflow-hidden shadow-xl shadow-[#234d1b]/10 shrink-0">
                <Image
                  src={
                    combo.images && combo.images[0]
                      ? combo.images[0]
                      : "https://via.placeholder.com/600x600?text=Combo"
                  }
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                  alt={combo.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              </div>

              <div className="flex-grow space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-1 bg-white px-4 py-1.5 rounded-full text-[10px] font-sans font-black uppercase tracking-widest text-accent shadow-sm">
                  <Percent size={12} /> Special Bundle
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary-dark leading-tight line-clamp-2">
                  {combo.name}
                </h3>
                <p className="text-xs font-sans font-bold text-primary/60 uppercase tracking-widest line-clamp-3 leading-relaxed">
                  {combo.description}
                </p>
                <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-sans font-black text-primary-dark">
                      ₹{combo.price}
                    </span>
                    {combo.mrp && combo.mrp > combo.price && (
                      <span className="text-primary/40 font-sans font-bold line-through text-lg">
                        ₹{combo.mrp}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(combo, 1)}
                    className="bg-primary text-secondary p-3 rounded-2xl hover:bg-primary-dark transition-all shadow-xl active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
