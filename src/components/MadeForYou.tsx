"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const giftingServices = [
  {
    title: "Customizable Packs",
    tagline: "Your taste. Your design. Your story - all inside a box.",
    description:
      "Create your own box of happiness - select from laddus, mixtures, halwas, and more. Multiple box sizes and mix-n-match options. Choose from festive, minimal, or luxe packaging styles. Perfect for: birthdays, gifting to loved ones, housewarming gifts, or self-indulgent moments.",
    image:
      "https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg?auto=compress&cs=tinysrgb&w=800",
    roundImage:
      "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=400",
    reverse: false,
    bgColor: "bg-secondary/20",
  },
  {
    title: "Personalized Branding",
    tagline: "Your Brand. Our Box. Infinite Impressions.",
    description:
      "Add your brand's logo, message, or campaign tagline on every gift box. Choose packaging themes that align with your visual identity or the occasion. Options for thank-you notes, QR code inserts, and social handle tags. Ideal for: corporate giveaways, event welcome kits, influencer collaborations, and launch promos.",
    image:
      "https://images.pexels.com/photos/6347514/pexels-photo-6347514.jpeg?auto=compress&cs=tinysrgb&w=800",
    roundImage:
      "https://images.pexels.com/photos/6347510/pexels-photo-6347510.jpeg?auto=compress&cs=tinysrgb&w=400",
    reverse: true,
    bgColor: "bg-white",
  },
  {
    title: "Bulk Orders",
    tagline: "Over 10,000+ handcrafted boxes shipped in 2024.",
    description:
      "Special pricing slabs for bulk orders above 100+ boxes. Flexible product combinations to suit your event needs. Guaranteed dispatch timelines with real-time tracking. Dedicated gifting manager to assist you from inquiry to delivery.",
    image:
      "https://images.pexels.com/photos/448835/pexels-photo-448835.jpeg?auto=compress&cs=tinysrgb&w=800",
    roundImage:
      "https://images.pexels.com/photos/1556691/pexels-photo-1556691.jpeg?auto=compress&cs=tinysrgb&w=400",
    reverse: false,
    bgColor: "bg-secondary/20",
  },
  {
    title: "Corporate Gifting",
    tagline: "Win hearts. One bite at a time.",
    description:
      "Celebrate team wins, onboardings, or festive seasons with a personal premium touch. Easy GST billing, address-wise dispatch, and gift scheduling. Custom notes and branding for internal or external stakeholders. Build loyalty with every sweet gesture - literally.",
    image:
      "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800",
    roundImage:
      "https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=400",
    reverse: true,
    bgColor: "bg-white",
  },
  {
    title: "Event Gifting",
    tagline: "Make your milestone moments even sweeter.",
    description:
      "Bespoke gifting for weddings, engagements, baby showers, housewarming, and more. Customization options: monograms, couple initials, event dates, and color themes. Guest-wise personalization for a truly memorable experience. Delivery options across India - straight to your venue or guest homes.",
    image:
      "https://images.pexels.com/photos/2253818/pexels-photo-2253818.jpeg?auto=compress&cs=tinysrgb&w=800",
    roundImage:
      "https://images.pexels.com/photos/169192/pexels-photo-169192.jpeg?auto=compress&cs=tinysrgb&w=400",
    reverse: false,
    bgColor: "bg-secondary/20",
  },
];

export default function MadeForYou() {
  return (
    <section id="made-for-you" className="py-20">
      {giftingServices.map((service, index) => (
        <div key={index} className={`${service.bgColor} py-24 overflow-hidden`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`flex flex-col ${service.reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-16`}
            >
              {/* Content Side */}
              <motion.div
                initial={{ opacity: 0, x: service.reverse ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex-1 space-y-8"
              >
                <h2 className="text-4xl md:text-5xl font-serif font-black text-primary-dark leading-tight">
                  {service.title}
                </h2>
                <h4 className="text-brown font-serif font-bold text-xl italic tracking-wide">
                  {service.tagline}
                </h4>
                <p className="text-primary/70 font-sans font-medium text-base leading-relaxed max-w-xl">
                  {service.description}
                </p>
                <button className="inline-flex items-center text-primary-dark font-sans font-black uppercase tracking-widest border-b-2 border-primary-dark pb-1 hover:text-accent hover:border-accent transition-all text-sm group">
                  Enquire Now{" "}
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>
              </motion.div>

              {/* Image Side */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex-1 relative"
              >
                {/* Main Image with Rounded Corners */}
                <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-[#234d1b]/10 aspect-[4/3] border-[6px] border-white relative">
                  <Image
                    src={service.image}
                    fill
                    className="object-cover transform hover:scale-105 transition-transform duration-700"
                    alt={service.title}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Floating Circle Image */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute ${service.reverse ? "-left-12 -bottom-12" : "-right-12 -bottom-12"} w-64 h-64 rounded-full border-[10px] border-secondary/50 overflow-hidden shadow-2xl shadow-[#234d1b]/10 hidden md:block relative`}
                >
                  <Image
                    src={service.roundImage}
                    fill
                    className="object-cover"
                    alt="Detail"
                    sizes="256px"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
