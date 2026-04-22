"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Lock, User as UserIcon, LogOut, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { validateForm, passwordResetSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

export default function ProfileClient() {
  const { data: session, isPending: status } = authClient.useSession();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!status && !session) {
      router.push("/login?callbackUrl=/profile");
    }
  }, [session, status, router]);

  // Check if Google account is linked
  useEffect(() => {
    const checkLinkedAccounts = async () => {
      try {
        const accounts = await authClient.listAccounts();
        if (accounts?.data) {
          const linked = accounts.data.some((a: any) =>
            a.provider === "google" || a.providerId === "google"
          );
          setIsGoogleLinked(linked);
        }
      } catch {
        // Fallback: if user has a Google profile image, they signed in with Google
        if (session?.user?.image) {
          setIsGoogleLinked(true);
        }
      }
    };
    if (session) checkLinkedAccounts();
  }, [session]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(passwordResetSchema, { password, confirmPassword });
    if (!validation.success) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set password");
      }

      toast.success(
        "Password set successfully! You can now login with your email and password.",
      );
      setPassword("");
      setConfirmPassword("");
      setFieldErrors({});
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      await authClient.linkSocial({
        provider: "google",
        callbackURL: "/profile",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to link Google account");
      setIsLinking(false);
    }
  };

  const handleSignout = async () => {
    try {
      await authClient.signOut();
      router.push("/login");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  if (status || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-secondary/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Loading Profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-secondary/30 flex flex-col">
      <div className="flex-grow pt-36 md:pt-40 pb-16 max-w-5xl mx-auto px-4 sm:px-6 w-full">
        {/* Header Section */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-1 block">
              Account Details
            </span>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-primary-dark">
              My <span className="text-primary italic">Profile</span>
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/orders")}
              className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-primary/20 transition-colors"
            >
              My Orders
            </button>
            <button
              onClick={handleSignout}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-red-100 transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Profile Info Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            {session.user.image ? (
              <img
                src={session.user.image || ""}
                alt={session.user.name || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <UserIcon size={28} className="text-primary" />
            )}
          </div>
          <div className="text-center sm:text-left min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-primary-dark truncate">
              {session.user.name}
            </h2>
            <p className="text-gray-500 text-xs md:text-sm font-medium truncate">
              {session.user.email}
            </p>
          </div>

          {/* Google Link Status - inline */}
          <div className="sm:ml-auto flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            {isGoogleLinked ? (
              <span className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-[10px] font-bold text-green-600 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Google Linked
              </span>
            ) : (
              <button
                onClick={handleLinkGoogle}
                disabled={isLinking}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isLinking ? "Linking..." : "Link Google"}
              </button>
            )}
          </div>
        </motion.div>

        {/* Security / Password Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 md:p-8 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary-dark">
                Account Security
              </h3>
              <p className="text-[10px] text-gray-500 font-medium">
                Set or update your password
              </p>
            </div>
          </div>

          <form onSubmit={handleSetPassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#234d1b]/70 mb-1.5 uppercase tracking-widest text-[10px]">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors(prev => ({ ...prev, password: "" }));
                }}
                className={`w-full px-4 py-3 bg-gray-50 border ${fieldErrors.password ? "border-red-300" : "border-gray-200"} rounded-xl outline-none focus:border-primary transition-colors focus:bg-white text-sm`}
                placeholder="Enter new password"
                minLength={8}
                required
              />
              <FormError message={fieldErrors.password} />
            </div>
            <div>
              <label className="block font-bold text-[#234d1b]/70 mb-1.5 uppercase tracking-widest text-[10px]">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                }}
                className={`w-full px-4 py-3 bg-gray-50 border ${fieldErrors.confirmPassword ? "border-red-300" : "border-gray-200"} rounded-xl outline-none focus:border-primary transition-colors focus:bg-white text-sm`}
                placeholder="Confirm new password"
                minLength={8}
                required
              />
              <FormError message={fieldErrors.confirmPassword} />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting || !password || !confirmPassword}
                className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-primary-dark transition-all shadow-md disabled:bg-gray-300 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
