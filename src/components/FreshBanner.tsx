"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { useState, useEffect } from "react";

export default function FreshBanner() {
  const [banner, setBanner] = useState(
    "https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=1600",
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.secondaryBanner) {
            setBanner(data.secondaryBanner);
          }
        }
      } catch (error) {
        console.error("Failed to fetch fresh banner settings", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <section className="relative h-[500px] flex items-center justify-center overflow-hidden my-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={banner}
          alt="Freshly baked artisan bread"
          className="w-full h-full object-cover"
          fill
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 text-center px-4"
      >
        <span className="text-secondary font-black tracking-[0.4em] uppercase text-xs mb-4 block">
          Our Heritage
        </span>
        <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 leading-tight">
          Freshly Baked with <br />
          <span className="italic">Traditional Recipes</span>
        </h2>
        <Link
          href="/shop"
          className="inline-block bg-white text-primary-dark font-black px-10 py-4 rounded-xl hover:bg-secondary hover:text-white transition-all shadow-2xl active:scale-95"
        >
          Discover the Taste
        </Link>
      </motion.div>
    </section>
  );
}
