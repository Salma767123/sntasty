"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavbarData } from "@/context/NavbarDataContext";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const { settings } = useNavbarData();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch {
      toast.error("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-secondary/30">
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg p-4 md:p-8 relative z-10"
      >
        <div className="glass-card !rounded-2xl md:!rounded-3xl px-8 pb-8 pt-5 md:px-12 md:pb-12 md:pt-6">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block mb-3">
              {settings?.logo ? (
                <div className="h-12 md:h-16 w-40 md:w-52 relative mx-auto">
                  <Image
                    src={settings.logo}
                    alt={settings.shopName || "Sai Nandhini"}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <span className="text-xl md:text-2xl font-serif font-bold text-primary-dark">
                  {settings?.shopName || "Sai Nandhini"}
                </span>
              )}
            </Link>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary-dark mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                If an account exists with <span className="font-semibold text-gray-700">{email}</span>, we've sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
              >
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary-dark text-center mb-1">
                Forgot Password?
              </h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                Enter your email and we'll send you a reset link
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-12 pr-6 outline-none transition-all shadow-sm"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-dark transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <p className="text-center mt-6 text-sm text-gray-500 font-medium">
                <Link href="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
