"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Loader2, CheckCircle2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavbarData } from "@/context/NavbarDataContext";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const { settings } = useNavbarData();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-serif font-bold text-primary-dark mb-2">Invalid Link</h2>
        <p className="text-gray-500 text-sm mb-6">This reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-primary font-bold hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <>
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

      {success ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-primary-dark mb-2">
            Password Reset!
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Your password has been updated successfully.
          </p>
          <Link
            href="/login"
            className="inline-block bg-primary text-white py-3 px-8 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-xl active:scale-95"
          >
            Login Now
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary-dark text-center mb-1">
            Set New Password
          </h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-12 pr-12 outline-none transition-all shadow-sm"
                  placeholder="Min 8 characters"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-12 pr-12 outline-none transition-all shadow-sm"
                  placeholder="Confirm password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-dark transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Reset Password"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500 font-medium">
            <Link href="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </p>
        </>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </main>
  );
}
