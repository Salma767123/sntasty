"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Image from "next/image";

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const displayImages =
    images?.length > 0
      ? images
      : [
          "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1000",
        ];

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 lg:sticky lg:top-32">
      {/* Thumbnails */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto no-scrollbar lg:max-h-[600px]">
        {displayImages.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
              i === activeIndex
                ? "border-primary shadow-md scale-105"
                : "border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-300"
            }`}
          >
            <Image
              src={img}
              fill
              className="object-cover"
              alt={`${name} view ${i + 1}`}
              sizes="80px"
            />
          </button>
        ))}
      </div>

      {/* Main Stage */}
      <div className="relative flex-grow aspect-square bg-gray-50 rounded-2xl overflow-hidden group border border-gray-200 shadow-sm">
        <div
          className="w-full h-full cursor-zoom-in"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full overflow-hidden"
            >
              <div
                className={`w-full h-full transition-transform duration-200 ${
                  isZoomed ? "scale-[2.5]" : "scale-100"
                }`}
                style={
                  isZoomed
                    ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` }
                    : {}
                }
              >
                <Image
                  src={displayImages[activeIndex]}
                  alt={name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Zoom Indicator */}
        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
            <ZoomIn size={14} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-700">
              Hover to zoom
            </span>
          </div>
        </div>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() =>
                setActiveIndex(
                  (prev) =>
                    (prev - 1 + displayImages.length) % displayImages.length,
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() =>
                setActiveIndex((prev) => (prev + 1) % displayImages.length)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
            {activeIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>
    </div>
  );
}
