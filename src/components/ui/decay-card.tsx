"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface DecayCardProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const DecayCard: React.FC<DecayCardProps> = ({
  children,
  className,
  containerClassName,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  useEffect(() => {
    if (isHovered) {
      const interval = setInterval(() => {
        const newParticle = {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          y: Math.random() * 100,
        };
        setParticles((prev) => [...prev.slice(-20), newParticle]);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setParticles([]);
    }
  }, [isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div className={cn("h-full", containerClassName)} style={{ perspective: "1000px" }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative rounded-3xl transition-all duration-200 h-full",
          className
        )}
      >
        {children}
        
        {/* Decay particles effect */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-20">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                x: `${particle.x}%`, 
                y: `${particle.y}%`,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                y: `${particle.y - 30}%`,
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
              }}
              className="absolute w-1.5 h-1.5 bg-[#f8bf51] rounded-full"
              style={{
                boxShadow: "0 0 6px rgba(248,191,81,0.8)",
              }}
            />
          ))}
        </div>

        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(248,191,81,0.2) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
      </motion.div>
    </div>
  );
};

