"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { validateForm, loginSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useNavbarData } from "@/context/NavbarDataContext";

export default function LoginPage() {
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

    const validation = validateForm(loginSchema, { email, password });
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
          // Block admin login on customer page
          const session = await authClient.getSession();
          if ((session.data?.user as any)?.role === "admin") {
            await authClient.signOut();
            setError("Admin login is not allowed here. Please use the admin portal.");
            setLoading(false);
            return;
          }
          router.push("/");
          router.refresh();
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Invalid email or password");
          setLoading(false);
        },
      },
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-secondary/30 ">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl p-4 md:p-8 relative z-10"
      >
        <div className="glass-card !rounded-2xl md:!rounded-3xl px-8 pb-8 pt-5 md:px-12 md:pb-12 md:pt-6">
          <div className="text-center mb-4 md:mb-6">
            <Link href="/" className="inline-block mb-2 md:mb-3">
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
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary-dark">
              Welcome Back
            </h2>
            <p className="text-gray-500 mt-1 md:mt-2 text-sm font-medium">
              Please enter your details to sign in
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
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
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className={`w-full bg-white/50 border ${fieldErrors.email ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-12 pr-6 outline-none transition-all shadow-sm`}
                    placeholder="name@example.com"
                  />
                </div>
                <FormError message={fieldErrors.email} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
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
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
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
            </div>

            <div className="flex justify-end -mt-2">
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-dark transition-all shadow-xl flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Sign In{" "}
                    <ArrowRight
                      className="group-hover:translate-x-1 transition-transform"
                      size={20}
                    />
                  </>
                )}
              </button>

              <Link
                href="/checkout"
                className="w-full bg-white border-2 border-primary/20 text-primary py-4 rounded-2xl font-bold text-base hover:bg-primary/5 transition-all shadow-sm flex items-center justify-center gap-2 group active:scale-95 text-center"
              >
                Continue as Guest{" "}
                <ArrowRight
                  className="group-hover:translate-x-1 transition-transform"
                  size={20}
                />
              </Link>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500 font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() =>
                  authClient.signIn.social({
                    provider: "google",
                    callbackURL: "/",
                  })
                }
                className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
              {/* Facebook button or others can be added here if needed */}
            </div>
          </div>

          <p className="text-center mt-10 text-sm text-gray-500 font-medium">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-bold hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
