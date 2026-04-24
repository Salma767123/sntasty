"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Instagram,
  Facebook,
  Mail,
  Phone,
  MapPin,
  ArrowUp,
} from "lucide-react";
import { useNavbarData } from "@/context/NavbarDataContext";

export default function Footer() {
  const { settings } = useNavbarData();
  const pathname = usePathname();

  const handleHashLink = (e: React.MouseEvent, link: string) => {
    const [path, hash] = link.split("#");
    if (hash && pathname === path) {
      e.preventDefault();
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative">
      {/* Main Footer */}
      <div className="bg-[#ece0cc] pt-20 pb-12 relative overflow-hidden border-t border-[#234d1b]/5">
        {/* Decorative dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #234d1b 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16 pb-16">
            {/* Column 1: Brand Info */}
            <div className="space-y-5">
              <Link href="/">
                {settings?.logo ? (
                  <div className="h-20 w-72 md:h-24 md:w-80 relative mb-4">
                    <Image
                      src={settings.logo}
                      alt={settings.shopName || "Sai Nandhini"}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <h2 className="text-3xl font-serif font-black text-[#234d1b] tracking-wide">
                    {settings?.shopName || "Sai Nandhini"}
                  </h2>
                )}
              </Link>
              <p className="text-[#3d7935] font-serif italic text-base">
                "Crafting Sweet Memories in Every Bite"
              </p>
              <p className="text-[#234d1b]/60 text-sm leading-relaxed max-w-xs font-medium">
                Authentic traditional sweets and savories made with pure
                ingredients, tailored for your premium taste.
              </p>

              <div className="space-y-3.5 pt-4">
                {settings?.contactPhone && (
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="flex items-center gap-3 group text-[#234d1b]/70 hover:text-[#234d1b] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#234d1b]/5 flex items-center justify-center group-hover:bg-[#3d7935] group-hover:text-white transition-all">
                      <Phone size={15} />
                    </div>
                    <span className="text-sm font-semibold">
                      {settings.contactPhone}
                    </span>
                  </a>
                )}
                {settings?.contactEmail && (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="flex items-center gap-3 group text-[#234d1b]/70 hover:text-[#234d1b] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#234d1b]/5 flex items-center justify-center group-hover:bg-[#3d7935] group-hover:text-white transition-all">
                      <Mail size={15} />
                    </div>
                    <span className="text-sm font-semibold">
                      {settings.contactEmail}
                    </span>
                  </a>
                )}
                {settings?.address && (
                  <div className="flex items-center gap-3 text-[#234d1b]/70">
                    <div className="w-9 h-9 rounded-xl bg-[#234d1b]/5 flex items-center justify-center">
                      <MapPin size={15} />
                    </div>
                    <span className="text-sm font-medium leading-snug">
                      {settings.address}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Our Policies */}
            <div>
              <h4 className="text-[#234d1b] font-bold text-base mb-6 relative inline-block">
                Our Policies
                <span className="absolute -bottom-1.5 left-0 w-8 h-[2px] bg-[#3d7935] rounded-full" />
              </h4>
              <ul className="space-y-3">
                {[
                  { name: "Privacy Policy", link: "/privacy-policy" },
                  { name: "Shipping Policy", link: "/shipping-policy" },
                  { name: "Return & Refund", link: "/return-and-refund" },
                  { name: "Terms & Conditions", link: "/terms" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.link}
                      className="text-[#234d1b]/60 hover:text-[#3d7935] hover:pl-1 transition-all text-sm font-medium"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Information */}
            <div>
              <h4 className="text-[#234d1b] font-bold text-base mb-6 relative inline-block">
                Information
                <span className="absolute -bottom-1.5 left-0 w-8 h-[2px] bg-[#3d7935] rounded-full" />
              </h4>
              <ul className="space-y-3">
                {[
                  { name: "Track Your Order", link: "/track" },
                  { name: "About Us", link: "/about" },
                  { name: "Contact Us", link: "/contact" },
                  { name: "Bulk Enquiry", link: "/contact#enquiry-form" },

                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.link}
                      onClick={(e) => handleHashLink(e, item.link)}
                      className="text-[#234d1b]/60 hover:text-[#3d7935] hover:pl-1 transition-all text-sm font-medium"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Made For You + Socials */}
            <div>
              <h4 className="text-[#234d1b] font-bold text-base mb-6 relative inline-block">
                Made For You
                <span className="absolute -bottom-1.5 left-0 w-8 h-[2px] bg-[#3d7935] rounded-full" />
              </h4>
              <ul className="space-y-3 mb-8">
                {[
                  { name: "Customizable Packs", link: "/contact#enquiry-form" },
                  { name: "Personalized Branding", link: "/contact#enquiry-form" },
                  { name: "Bulk Orders", link: "/contact#enquiry-form" },
                  { name: "Corporate Gifting", link: "/contact#enquiry-form" },
                  { name: "Event Gifting", link: "/contact#enquiry-form" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.link}
                      onClick={(e) => handleHashLink(e, item.link)}
                      className="text-[#234d1b]/60 hover:text-[#3d7935] hover:pl-1 transition-all text-sm font-medium"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Social Media */}
              <div className="flex gap-3">
                {settings?.socialMedia?.instagram && (
                  <a
                    href={settings.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-[#234d1b]/5 flex items-center justify-center text-[#234d1b]/60 hover:bg-[#3d7935] hover:text-white transition-all"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                {settings?.socialMedia?.facebook && (
                  <a
                    href={settings.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-[#234d1b]/5 flex items-center justify-center text-[#234d1b]/60 hover:bg-[#3d7935] hover:text-white transition-all"
                  >
                    <Facebook size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="flex justify-center items-center text-center border-t border-[#234d1b]/10 pt-8">
            <p className="text-[#234d1b]/40 text-xs font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} Sai Nandhini Tasty World. All Rights
              Reserved. <span className="text-red-400">&#10084;</span> Developed by <a href="https://www.mntfuture.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#234d1b]/70 transition-colors">MnT</a>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Scroll To Top */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        <button
          onClick={scrollToTop}
          className="w-11 h-11 bg-[#f8bf51] text-[#234d1b] rounded-xl flex items-center justify-center shadow-xl hover:bg-white transition-all"
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </footer>
  );
}
