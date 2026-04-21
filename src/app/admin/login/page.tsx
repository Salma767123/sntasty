"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { validateForm, adminLoginSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";
import { useNavbarData } from "@/context/NavbarDataContext";

export default function AdminLoginPage() {
  const { settings } = useNavbarData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validation = validateForm(adminLoginSchema, { email, password });
    if (!validation.success) {
      setFieldErrors(validation.errors);
      setLoading(false);
      return;
    }
    setFieldErrors({});

    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: async () => {
          // Verify the user is actually an admin
          const session = await authClient.getSession();
          if ((session.data?.user as any)?.role !== "admin") {
            await authClient.signOut();
            setError("Access denied. This portal is for administrators only.");
            setLoading(false);
            return;
          }
          router.push("/admin/dashboard");
          router.refresh();
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Invalid admin credentials");
          setLoading(false);
        },
      },
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#556B2F]">
      {/* Background Texture */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-6 relative z-10"
      >
        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
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
                <span className="text-2xl font-serif font-black text-[#556B2F]">
                  {settings?.shopName || "Sai Nandhini Tasty World"}
                </span>
              )}
            </Link>
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="text-[#556B2F]" size={20} />
              <h2 className="text-xl font-black text-[#556B2F] uppercase tracking-widest">
                Admin Portal
              </h2>
            </div>
            <p className="text-gray-400 text-sm font-medium">
              Access your management dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black uppercase tracking-wider text-center border border-red-100"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: "" })); }}
                className={`w-full bg-[#fcf9f4] border-2 ${fieldErrors.email ? "border-red-300" : "border-transparent"} focus:border-[#556B2F]/10 focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all font-bold text-[#556B2F]`}
                placeholder="admin@sainandhini.com"
              />
              <FormError message={fieldErrors.email} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                Access Key
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: "" })); }}
                  className={`w-full bg-[#fcf9f4] border-2 ${fieldErrors.password ? "border-red-300" : "border-transparent"} focus:border-[#556B2F]/10 focus:bg-white rounded-2xl py-4 pl-14 pr-14 outline-none transition-all font-bold text-[#556B2F]`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#556B2F] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FormError message={fieldErrors.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#556B2F] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-[#3A4B2C] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 mt-4 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Verify Admin Access{" "}
                  <ArrowRight
                    className="group-hover:translate-x-1 transition-transform"
                    size={18}
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
            <Link
              href="/login"
              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#556B2F] transition-all"
            >
              Back to Customer Login
            </Link>
          </div>
        </div>

        <p className="text-center mt-8 text-[#fcf9f4]/40 text-[10px] font-bold uppercase tracking-[0.3em]">
          Internal Systems — Unauthorized Access Prohibited
        </p>
      </motion.div>
    </main>
  );
}
