"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, User, Phone, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { validateForm, registerSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";
import { motion } from "framer-motion";
import { useNavbarData } from "@/context/NavbarDataContext";

export default function RegisterPage() {
  const { settings } = useNavbarData();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validation = validateForm(registerSchema, formData);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      setLoading(false);
      return;
    }
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/login?registered=true");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-secondary/30 pt-20 pb-10">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-4 md:p-8 relative z-10"
      >
        <div className="glass-card p-6 md:p-10">
          <div className="text-center mb-6 md:mb-10">
            <Link href="/" className="inline-block mb-4 md:mb-6">
              {settings?.logo ? (
                <div className="h-14 md:h-20 w-48 md:w-64 relative mx-auto">
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
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary-dark">
              Create Account
            </h2>
            <p className="text-gray-500 mt-1 md:mt-2 text-sm font-medium">
              Join us for a world of authentic flavors
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFieldErrors(prev => ({ ...prev, name: "" }));
                  }}
                  className={`w-full bg-white/50 border ${fieldErrors.name ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-12 pr-6 outline-none transition-all shadow-sm`}
                  placeholder="John Doe"
                />
              </div>
              <FormError message={fieldErrors.name} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setFieldErrors(prev => ({ ...prev, email: "" }));
                  }}
                  className={`w-full bg-white/50 border ${fieldErrors.email ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-12 pr-6 outline-none transition-all shadow-sm`}
                  placeholder="name@example.com"
                />
              </div>
              <FormError message={fieldErrors.email} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    setFieldErrors(prev => ({ ...prev, phone: "" }));
                  }}
                  className={`w-full bg-white/50 border ${fieldErrors.phone ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-12 pr-6 outline-none transition-all shadow-sm`}
                  placeholder="+91 98765 43210"
                />
              </div>
              <FormError message={fieldErrors.phone} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setFieldErrors(prev => ({ ...prev, password: "" }));
                  }}
                  className={`w-full bg-white/50 border ${fieldErrors.password ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-12 pr-12 outline-none transition-all shadow-sm`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FormError message={fieldErrors.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-xl flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Create Account{" "}
                  <ArrowRight
                    className="group-hover:translate-x-1 transition-transform"
                    size={18}
                  />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 md:mt-10 text-xs md:text-sm text-gray-500 font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-bold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
