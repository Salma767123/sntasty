"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { CometCard } from "@/components/ui/comet-card";

export default function AboutUs({ ourStory }: { ourStory?: any }) {
  // Use data from admin if available, else fallback
  const title = ourStory?.title || "Bringing the Authentic Taste of Madurai to Your Table.";
  const highlightWord = ourStory?.highlightWord || "Taste of Madurai";
  const desc = ourStory?.description || "What started as a small family kitchen has grown into Madurai's most loved destination for premium sweets and savories. At Sai Nandhini, we don't just bake; we craft memories using traditional wood-fired techniques and locally sourced, pure ingredients.";
  const image = ourStory?.image || "https://images.pexels.com/photos/3983674/pexels-photo-3983674.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
  const badge = ourStory?.yearsExcellence || "25+";
  const bullets = ourStory?.bullets && ourStory.bullets.length > 0 
    ? ourStory.bullets 
    : [
        "100% Natural Ingredients, No Preservatives",
        "Traditional Wood-Fired Baking Methods",
        "Daily Fresh Batches, Made with Love",
      ];

  // Helper to safely highlight word in title
  const renderTitle = () => {
    if (!highlightWord) return title;
    const parts = title.split(new RegExp(`(${highlightWord})`, "i"));
    return parts.map((part: string, i: number) => 
      part.toLowerCase() === highlightWord.toLowerCase() ? (
        <span key={i} className="italic text-[#f8bf51]">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <section className="py-28 bg-[#ece0cc] relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-[#234d1b] blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#f8bf51] blur-3xl" />
      </div>

      {/* Diagonal subtle line decoration */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #234d1b, #234d1b 1px, transparent 1px, transparent 60px)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <CometCard className="h-full">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-[#234d1b]/10 border-4 border-white">
                <Image
                  src={image}
                  alt="Our Story"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Floating Badge */}
                <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl max-w-[180px] border border-white/50 z-10">
                  <p className="text-3xl font-serif font-black text-[#234d1b] mb-0.5">
                    {badge}
                  </p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#234d1b]/50">
                    Years of Culinary Excellence
                  </p>
                </div>
              </div>
            </CometCard>

            {/* Decorative frame element */}
            <div className="absolute -top-4 -left-4 w-24 h-24 border-l-4 border-t-4 border-[#f8bf51]/30 rounded-tl-3xl pointer-events-none" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r-4 border-b-4 border-[#234d1b]/20 rounded-br-3xl pointer-events-none" />
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#f8bf51] mb-5 block">
              Our Story
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-[#234d1b] leading-tight mb-3 tracking-tight">
              {renderTitle()}
            </h2>
            <div className="w-16 h-1 bg-[#f8bf51] rounded-full mb-6" />
            <p className="text-lg text-[#234d1b]/50 mb-8 leading-relaxed font-medium whitespace-pre-line">
              {desc}
            </p>

            <div className="space-y-4 mb-10">
              {bullets.map((item: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#234d1b]/10 flex items-center justify-center text-[#234d1b] shrink-0 group-hover:bg-[#234d1b] group-hover:text-white transition-all duration-300">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-[#234d1b] font-bold text-sm tracking-wide">
                    {item}
                  </span>
                </motion.div>
              ))}
            </div>

            <Link
              href="/about"
              className="inline-flex items-center gap-3 bg-[#234d1b] text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-xl shadow-[#234d1b]/15 hover:bg-[#f8bf51] hover:text-[#234d1b] transition-all duration-300 active:scale-95 group"
            >
              Read Our Full Story
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
