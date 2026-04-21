"use client";

import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { validateForm, newsletterSchema, FieldErrors } from "@/lib/validations";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm(newsletterSchema, { email });
    if (!validation.success) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});
    setSubscribed(true);
    setEmail("");
  };

  return (
    <section className="py-24 bg-[#ece0cc]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#234d1b] rounded-3xl px-8 py-16 md:p-20 shadow-2xl overflow-hidden">
          {/* Decorative dot pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Glow effects */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#f8bf51]/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 text-center max-w-xl mx-auto">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Mail size={26} className="text-[#f8bf51]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tight mb-4">
              Join the{" "}
              <span className="text-[#f8bf51] italic">Tasty World</span> Club
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-md mx-auto">
              Get exclusive weekly deals, fresh recipes, and early access to
              holiday gift hampers direct to your inbox.
            </p>

            {!subscribed ? (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex-grow bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 focus-within:border-[#f8bf51]/40 focus-within:bg-white/15 transition-all p-1">
                  <input
                    type="email"
                    placeholder="Enter your email address..."
                    className="w-full bg-transparent outline-none font-medium text-sm text-white placeholder:text-white/30 px-4 py-3"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors(prev => ({ ...prev, email: "" }));
                    }}
                    required
                  />
                </div>
                {fieldErrors.email && <p className="text-red-300 text-xs font-semibold mt-2 ml-1">{fieldErrors.email}</p>}
                <button
                  type="submit"
                  className="bg-[#f8bf51] text-[#234d1b] px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-[11px] hover:bg-[#d4b76e] transition-all shadow-xl shadow-[#f8bf51]/15 flex items-center justify-center gap-2.5 active:scale-95 group shrink-0"
                >
                  Subscribe{" "}
                  <Send
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 border border-white/10 p-6 rounded-2xl text-white font-semibold text-sm"
              >
                ✨ Welcome aboard! Check your inbox for 10% off your first
                order.
              </motion.div>
            )}
            <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-white/25">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
