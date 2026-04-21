"use client";

import Navbar from "@/components/Navbar";
import Image from "next/image";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, Zap, Utensils } from "lucide-react";
import { CometCard } from "@/components/ui/comet-card";
import { cn } from "@/lib/utils";

export default function AboutPublicClient({ initialAboutUs }: { initialAboutUs: any }) {
  const aboutUs = initialAboutUs || {};

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/30 -z-10 rounded-l-[10rem]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">
              Our Heritage
            </span>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-primary-dark leading-tight mb-8">
              {aboutUs.heroTitle?.split("\n").map((line: string, i: number) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              )) || (
                <>Preserving the <span className="text-primary italic">Soul</span><br />of South India.</>
              )}
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed font-medium">
              {aboutUs.heroDescription ||
                "At Sai Nandhini Tasty World, we believe that food is more than just sustenance; it's a legacy. Founded on the principles of authenticity and purity, we bring the timeless recipes of our grandmothers' kitchens to your doorstep."}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <CometCard className="h-full">
              <div className="w-full aspect-square rounded-[4rem] overflow-hidden shadow-2xl skew-y-3 bg-gray-100 relative">
                <Image
                  src={aboutUs.heroImage || "https://images.pexels.com/photos/4134783/pexels-photo-4134783.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"}
                  alt="Our Traditional Kitchen"
                  className="w-full h-full object-cover"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </CometCard>
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-xl max-w-xs -skew-y-3 border border-gray-100 z-10">
              <p className="text-primary-dark font-serif font-bold text-lg leading-relaxed">
                {aboutUs.heroQuote || '"The secret ingredient is always love and a pinch of tradition."'}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section - Professional Redesign */}
      <section className="relative py-40 overflow-hidden bg-[#0a1a08]">
        {/* Advanced Background Layering */}
        <div className="absolute inset-0">
          {/* Base deep green with very subtle noise texture placeholder */}
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
          />

          {/* Elegant Mesh Gradients */}
          <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-accent/5 blur-[150px] rounded-full -translate-x-1/4 translate-y-1/4" />

          {/* Subtle Geometric Overlay */}
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}
          />
        </div>

        {/* Section Divider - Top Curve */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[80px] fill-white">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.44,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113,2,1200,60.29V0Z" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start mb-24">
            <div className="lg:col-span-12 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm"
              >
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="text-accent font-bold uppercase tracking-[0.4em] text-[10px]">
                  Our Philosophy
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-8xl font-serif font-black tracking-tight leading-[0.9] mb-10 whitespace-pre-wrap"
              >
                {aboutUs.storyTitle || "Crafting Memories,\nOne Batch at a Time."}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-gray-400 text-lg md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed"
              >
                {aboutUs.storyDescription ||
                  "We don't just sell food; we serve the same love and purity that defined the heritage of our family kitchens."}
              </motion.p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                title: "Pure Authenticity",
                desc: "No artificial colors or preservatives. Just pure, home-made ingredients sourced directly from farmers.",
                icon: ShieldCheck,
                color: "from-emerald-600/20 to-transparent",
                glow: "group-hover:shadow-[0_0_50px_rgba(16,185,129,0.1)]",
                num: "01"
              },
              {
                title: "Crafted with Love",
                desc: "Every batch is hand-crafted to maintain that nostalgic homemade taste that defines our heritage.",
                icon: Heart,
                color: "from-rose-600/20 to-transparent",
                glow: "group-hover:shadow-[0_0_50px_rgba(244,63,94,0.1)]",
                num: "02"
              },
              {
                title: "Fast Tradition",
                desc: "Traditional flavors delivered with modern speed. Freshly made and delivered directly to you.",
                icon: Zap,
                color: "from-amber-600/20 to-transparent",
                glow: "group-hover:shadow-[0_0_50px_rgba(245,158,11,0.1)]",
                num: "03"
              },
            ].map((val, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <CometCard className="h-full">
                  <div className={cn(
                    "group relative p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl h-full flex flex-col items-center text-center transition-all duration-500 hover:bg-white/[0.06] hover:border-white/20",
                    val.glow
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-10 bg-gradient-to-br border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500",
                      val.color
                    )}>
                      <val.icon size={30} className="text-white" />
                    </div>

                    <h3 className="text-2xl font-serif font-black mb-4 tracking-tight group-hover:text-accent transition-colors duration-300">
                      {val.title}
                    </h3>
                    <p className="text-gray-400 text-base leading-relaxed font-medium group-hover:text-white/80 transition-colors duration-300">
                      {val.desc}
                    </p>

                    {/* Micro-Interaction Line */}
                    <div className="mt-8 w-12 h-1 bg-white/10 rounded-full group-hover:w-full group-hover:bg-accent/30 transition-all duration-700" />
                  </div>
                </CometCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section Divider - Bottom Curve */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[80px] fill-white">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.44,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113,2,1200,60.29V0Z" />
          </svg>
        </div>
      </section>

      {/* Culinary Journey */}
      <section className="py-32 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="order-2 lg:order-1 relative">
          <div className="grid grid-cols-2 gap-4">
            <CometCard className="h-full mt-10">
              <div className="relative aspect-square">
                <Image
                  src={aboutUs.journeyImage1 || "https://images.pexels.com/photos/674483/pexels-photo-674483.jpeg?auto=compress&cs=tinysrgb&w=800"}
                  className="rounded-3xl shadow-lg w-full h-full object-cover"
                  alt="Spices"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            </CometCard>
            <CometCard className="h-full">
              <div className="relative aspect-square">
                <Image
                  src={aboutUs.journeyImage2 || "https://images.pexels.com/photos/1055271/pexels-photo-1055271.jpeg?auto=compress&cs=tinysrgb&w=800"}
                  className="rounded-3xl shadow-lg w-full h-full object-cover"
                  alt="Sweets"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            </CometCard>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <Utensils className="text-primary mb-6" size={40} />
          <h2 className="text-5xl font-serif font-bold text-primary-dark mb-8">
            {aboutUs.journeyTitle || "From Our Family To Yours."}
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed font-medium mb-10">
            {aboutUs.journeyDescription ||
              "Sai Nandhini started as a small kitchen experiment by a family of food enthusiasts who couldn't find the authentic taste of home in store-bought products. Today, we've grown into a community of thousands who share the same love for traditional South Indian delicacies."}
          </p>
          <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-10">
            <div>
              <p className="text-4xl font-bold text-primary mb-1">
                {aboutUs.happyCustomers || "10k+"}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Happy Customers
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-1">
                {aboutUs.secretRecipes || "50+"}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Secret Recipes
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
