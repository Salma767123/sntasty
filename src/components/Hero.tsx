"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Sparkles, Shield, Truck } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Hero() {
  const [banner, setBanner] = useState(
    "https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg?auto=compress&cs=tinysrgb&w=1600",
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.heroBanner) {
            setBanner(data.heroBanner);
          }
        }
      } catch (error) {
        console.error("Failed to fetch hero settings", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden bg-[#234d1b]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={banner}
          className="w-full h-full object-cover opacity-40"
          alt="Authentic Indian food spread"
          fill
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#234d1b] via-[#234d1b]/85 to-[#234d1b]/40" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#234d1b] to-transparent" />
      </div>

      {/* Content */}
      <div className="w-full px-6 md:px-12 lg:px-24 relative z-10 pt-44 pb-20">
        <div className="max-w-3xl">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 mb-8"
          >
            <Sparkles size={14} className="text-[#f8bf51]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/90">
              Trusted by 5,000+ Families in Madurai
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif font-black text-white leading-[1.05] tracking-tight mb-7"
          >
            Authentic Flavours, <br className="hidden md:block" />
            Crafted with{" "}
            <span className="relative inline-block text-[#f8bf51]">
              Love
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
              >
                <path
                  d="M2 8 C 40 2, 80 12, 120 6 S 180 2, 198 8"
                  stroke="#f8bf51"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl text-white/70 font-medium mb-12 leading-relaxed max-w-xl"
          >
            Handpicked spices, traditional recipes, and pure ingredients —
            delivered fresh from our kitchen to your doorstep.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="flex flex-wrap gap-4 mb-16"
          >
            <Link
              href="/shop"
              className="bg-[#f8bf51] text-[#234d1b] px-10 py-5 rounded-2xl font-bold uppercase tracking-wider text-[12px] shadow-xl shadow-[#f8bf51]/20 hover:bg-[#d4b76e] transition-all active:scale-95 flex items-center gap-3 group"
            >
              Shop Now
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              href="/about"
              className="bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-wider text-[12px] border border-white/20 hover:bg-white/20 transition-all active:scale-95"
            >
              Our Story
            </Link>
          </motion.div>

          {/* Trust Points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-wrap gap-8"
          >
            {[
              { icon: Shield, text: "100% Natural" },
              { icon: Sparkles, text: "Handmade Fresh" },
              { icon: Truck, text: "Pan-India Delivery" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <item.icon size={16} className="text-[#f8bf51]" />
                </div>
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                  {item.text}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Decorative Bottom Curve */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path
            d="M0 60V30C240 5 480 0 720 10C960 20 1200 45 1440 30V60H0Z"
            fill="#ece0cc"
          />
        </svg>
      </div>
    </section>
  );
}
