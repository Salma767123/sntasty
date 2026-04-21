"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Leaf,
  Shield,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { CometCard } from "@/components/ui/comet-card";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */
interface Slide {
  _id?: string;
  title: string;
  titleAccent: string;
  tag: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  badge1: string;
  badge2: string;
}

/* ═══════════════════════════════════════════════════════════════
   Helper function to convert Cloudinary public ID to full URL
   ═══════════════════════════════════════════════════════════════ */
function getImageUrl(image: string): string {
  if (!image) return "";
  // If it's already a full URL, return as is
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  // If it's a Cloudinary public ID, convert to full URL
  if (image.includes("/")) {
    return `https://res.cloudinary.com/druglbh2m/image/upload/f_auto,q_auto/v1/${image}`;
  }
  // Fallback
  return image;
}

/* ═══════════════════════════════════════════════════════════════
   Fallback slides (used only while API is loading)
   ═══════════════════════════════════════════════════════════════ */
const fallbackSlides: Slide[] = [
  {
    title: "Freshly Baked",
    titleAccent: "Cookies",
    tag: "Bestseller",
    description:
      "Irresistible homemade cookies baked fresh daily with premium butter and finest ingredients. From classic choco-chip to exotic flavours — pure indulgence in every bite.",
    image:
      "https://images.pexels.com/photos/890577/pexels-photo-890577.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    ctaText: "Shop Cookies",
    ctaLink: "/shop?category=Cookies",
    badge1: "Freshly Baked",
    badge2: "Premium Butter",
  },
  {
    title: "Decadent Fudge",
    titleAccent: "Brownies",
    tag: "New Arrival",
    description:
      "Rich, moist and intensely chocolatey brownies made with Belgian cocoa. Our special and classic brownies are the ultimate treat for every chocolate lover.",
    image:
      "https://images.pexels.com/photos/3026804/pexels-photo-3026804.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    ctaText: "Shop Brownies",
    ctaLink: "/shop?category=Brownie",
    badge1: "Belgian Cocoa",
    badge2: "Eggless Options",
  },
  {
    title: "Celebration",
    titleAccent: "Cakes",
    tag: "Premium",
    description:
      "Handcrafted cakes for every occasion — birthdays, anniversaries, and festive moments. Made fresh to order with love and the finest ingredients from Madurai.",
    image:
      "https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    ctaText: "Shop Cakes",
    ctaLink: "/shop?category=Cake",
    badge1: "Made to Order",
    badge2: "Fresh Cream",
  },
];

/* ═══════════════════════════════════════════════════════════════
   Animation variants
   ═══════════════════════════════════════════════════════════════ */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
    scale: 0.96,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -120 : 120,
    opacity: 0,
    scale: 0.96,
  }),
};

const imageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
    scale: 0.85,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
    scale: 0.85,
    transition: { duration: 0.5 },
  }),
};

/* ═══════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════ */
export default function HeroCarousel({
  initialSlides,
}: {
  initialSlides?: Slide[];
}) {
  const [[currentSlide, direction], setSlide] = useState<[number, number]>([
    0, 0,
  ]);
  const [isPaused, setIsPaused] = useState(false);
  const [slides, setSlides] = useState<Slide[]>(
    initialSlides && initialSlides.length > 0 ? initialSlides : fallbackSlides,
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Fetch slides from API (removed for RSC) ── */

  /* ── Auto-play ── */
  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setSlide(([prev]) => [(prev + 1) % slides.length, 1]);
      }
    }, 6000);
  }, [isPaused, slides.length]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoPlay]);

  const goTo = (index: number) => {
    const dir = index > currentSlide ? 1 : -1;
    setSlide([index, dir]);
  };

  const next = () => {
    setSlide(([prev]) => [(prev + 1) % slides.length, 1]);
    startAutoPlay();
  };

  const prev = () => {
    setSlide(([prev]) => [(prev - 1 + slides.length) % slides.length, -1]);
    startAutoPlay();
  };

  const slide = slides[currentSlide] || slides[0];

  return (
    <section
      className="relative bg-gradient-to-b from-[#f8bf51] via-[#ffd788] to-[#ece0cc] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ───── Decorative Background ───── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #234d1b 0.8px, transparent 0.8px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-[#234d1b]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/[0.15] rounded-full blur-[100px]" />
      </div>

      {/* ───── Main Carousel Content ───── */}
      <div className="relative z-10 max-w-[1440px] mx-auto min-h-[85vh] md:min-h-[720px] flex items-center px-6 md:px-12 lg:px-20 pt-44 md:pt-44 pb-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center">
          {/* ── Left: Text Content ── */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`text-${currentSlide}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-start justify-center"
            >
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-1.5 mb-6">
                <Sparkles size={13} className="text-[#234d1b]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#234d1b]">
                  {slide.tag}
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[2.8rem] md:text-6xl lg:text-[4.2rem] font-serif font-black text-[#234d1b] leading-[1.08] tracking-tight mb-2">
                {slide.title}
              </h1>
              <h1 className="text-[2.8rem] md:text-6xl lg:text-[4.2rem] font-serif font-black text-[#234d1b] italic leading-[1.08] tracking-tight mb-6">
                {slide.titleAccent}
              </h1>

              {/* Gold divider */}
              <div className="w-16 h-[2px] bg-gradient-to-r from-[#234d1b] to-transparent mb-6" />

              {/* Description */}
              <p className="text-[#234d1b]/70 text-base md:text-[17px] leading-relaxed max-w-md mb-10 font-medium">
                {slide.description}
              </p>

              {/* CTA + Badges */}
              <div className="flex flex-wrap items-center gap-5 mb-8">
                <Link
                  href={slide.ctaLink || "/shop"}
                  className="group bg-[#234d1b] text-white px-9 py-4 rounded-full font-bold uppercase tracking-wider text-[11px] shadow-xl shadow-[#234d1b]/20 hover:bg-[#3d7935] hover:shadow-2xl transition-all active:scale-95 flex items-center gap-2.5"
                >
                  {slide.ctaText || "Shop Now"}
                  <ArrowRight
                    size={15}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="/shop"
                  className="text-[#234d1b]/70 hover:text-[#234d1b] text-xs font-bold uppercase tracking-widest border-b border-[#234d1b]/30 hover:border-[#234d1b] pb-0.5 transition-all"
                >
                  View All →
                </Link>
              </div>

              {/* Bottom Badges */}
              <div className="flex gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#234d1b]/15 flex items-center justify-center">
                    <Leaf size={13} className="text-[#234d1b]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#234d1b]/60">
                    {slide.badge1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#234d1b]/15 flex items-center justify-center">
                    <Shield size={13} className="text-[#234d1b]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#234d1b]/60">
                    {slide.badge2}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Right: Product Image ── */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`img-${currentSlide}`}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative flex items-center justify-center"
            >
              <div className="relative w-full max-w-lg lg:max-w-xl mx-auto">
                <CometCard className="h-full">
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border border-white/5 group">
                    <Image
                      src={getImageUrl(slide.image)}
                      alt={`${slide.title} ${slide.titleAccent}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#234d1b]/20 via-transparent to-transparent" />
                  </div>
                </CometCard>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ───── Navigation Arrows ───── */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/40 backdrop-blur-md border border-white/30 text-[#234d1b]/70 hover:text-[#234d1b] hover:bg-white/60 flex items-center justify-center transition-all group"
            aria-label="Previous slide"
          >
            <ChevronLeft
              size={22}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
          </button>
          <button
            onClick={next}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/40 backdrop-blur-md border border-white/30 text-[#234d1b]/70 hover:text-[#234d1b] hover:bg-white/60 flex items-center justify-center transition-all group"
            aria-label="Next slide"
          >
            <ChevronRight
              size={22}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </>
      )}

      {/* ───── Slide Indicators (Dots) ───── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === currentSlide
                ? "w-8 h-2.5 bg-[#234d1b] shadow-lg shadow-[#234d1b]/30"
                : "w-2.5 h-2.5 bg-[#234d1b]/25 hover:bg-[#234d1b]/50"
            }`}
          />
        ))}
      </div>

      {/* ───── Bottom Curve ───── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <svg
          viewBox="0 0 1440 50"
          fill="none"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 50V25C240 5 480 0 720 8C960 16 1200 40 1440 25V50H0Z"
            fill="#ece0cc"
          />
        </svg>
      </div>
    </section>
  );
}
