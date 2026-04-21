"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

/*
  DESIGN DIRECTION: "Refined Minimalism"
  ─────────────────────────────────────────────────
  Based on frontend-design skill instructions for "Simple and Professional".
  Focuses on:
  - Clean, structured spatial composition with generous negative space
  - Precision in typography and alignment
  - Subtle, restrained motion (fade and slide)
  - Elimination of heavy textures, masks, and complex shapes
*/

export default function CTASection() {
  return (
    <section className="py-24 lg:py-32 bg-[#234d1b]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-16 lg:p-20 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left Column: Typography & Intent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <p className="text-[#f8bf51] text-sm font-semibold tracking-widest uppercase flex items-center gap-3">
                  <span className="w-8 h-[1px] bg-[#f8bf51]"></span>
                  Sai Nandhini Premium
                </p>
                <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white leading-[1.15] tracking-tight">
                  Taste the tradition your family deserves.
                </h2>
                <p
                  className="text-white/60 text-lg leading-relaxed max-w-md"
                  style={{ fontFamily: "var(--font-poppins), sans-serif" }}
                >
                  Handcrafted sweets and artisanal snacks made daily with pure
                  ingredients. Delivered fresh across India.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                <Link
                  href="/shop"
                  className="group bg-[#f8bf51] hover:bg-[#ffd788] text-[#234d1b] px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto"
                >
                  Shop All Products
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform duration-300"
                  />
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Structured Reassurance */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="space-y-6 lg:pl-8 lg:border-l lg:border-white/10"
            >
              {[
                {
                  title: "100% Homemade",
                  desc: "Crafted without machines using generational recipes.",
                },
                {
                  title: "Pure Ingredients",
                  desc: "No artificial colours or chemical preservatives.",
                },
                {
                  title: "Secure Packaging",
                  desc: "Sealed for freshness with premium pan-India transit.",
                },
                {
                  title: "Free Delivery",
                  desc: "Available on select locations.",
                },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle2
                    size={24}
                    className="text-[#f8bf51] shrink-0 mt-0.5"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="text-white font-semibold text-base mb-1 tracking-wide">
                      {item.title}
                    </h3>
                    <p
                      className="text-white/50 text-sm leading-relaxed"
                      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
