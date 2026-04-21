"use client";

import { motion } from "framer-motion";
import { Leaf, Timer, Heart, Award } from "lucide-react";

const trustPoints = [
  {
    icon: Leaf,
    title: "100% Natural",
    desc: "Pure ingredients with zero preservatives. Every product passes our quality check.",
    stat: "0%",
    statLabel: "Preservatives",
  },
  {
    icon: Timer,
    title: "Fresh Daily",
    desc: "Made fresh every morning in our Madurai kitchen using traditional wood-fired methods.",
    stat: "6AM",
    statLabel: "Baked Fresh",
  },
  {
    icon: Award,
    title: "Premium Quality",
    desc: "Sourced from 12+ partner farms in Tamil Nadu. Supporting sustainable local agriculture.",
    stat: "12+",
    statLabel: "Farm Partners",
  },
  {
    icon: Heart,
    title: "Made with Love",
    desc: "Heritage recipes refined over 25 years — delivering the authentic taste of home.",
    stat: "25+",
    statLabel: "Years Legacy",
  },
];

export default function TrustSection() {
  return (
    <section className="py-24 bg-[#ece0cc] relative overflow-hidden">
      {/* Subtle decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #234d1b 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      />

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
            Why Sai Nandhini
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-black text-[#234d1b] tracking-tight">
            The Promise Behind Every Bite
          </h2>
          <div className="w-16 h-1 bg-[#f8bf51] rounded-full mx-auto mt-5" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustPoints.map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 relative group transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-[#234d1b]/8 border border-[#234d1b]/5 overflow-hidden"
            >
              {/* Background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#234d1b]/[0.02] to-[#f8bf51]/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

              <div className="relative z-10">
                {/* Icon */}
                <div className="w-14 h-14 bg-[#234d1b] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#f8bf51] group-hover:scale-110 transition-all duration-500 shadow-lg shadow-[#234d1b]/15 group-hover:shadow-[#f8bf51]/25">
                  <point.icon
                    size={24}
                    className="text-white group-hover:text-[#234d1b] transition-colors duration-500"
                  />
                </div>

                {/* Stat Badge */}
                <div className="mb-5">
                  <span className="text-3xl font-serif font-black text-[#234d1b] leading-none">
                    {point.stat}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#234d1b]/40 block mt-1">
                    {point.statLabel}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#234d1b] mb-2.5">
                  {point.title}
                </h3>

                <p className="text-sm text-[#234d1b]/50 leading-relaxed">
                  {point.desc}
                </p>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#234d1b] to-[#f8bf51] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
