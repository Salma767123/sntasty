"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

function PhonePeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const orderId = searchParams.get("orderId");
  const mtid = searchParams.get("mtid");

  const [status, setStatus] = useState<"verifying" | "success" | "pending" | "failed">(
    "verifying",
  );
  const [message, setMessage] = useState<string>("");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    if (!mtid) {
      setStatus("failed");
      setMessage(
        "Missing transaction reference. If you completed payment, please contact support with your transaction time.",
      );
      return;
    }

    let pendingPolls = 0;
    let cancelled = false;
    let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let successRedirectId: ReturnType<typeof setTimeout> | null = null;
    const MAX_PENDING_POLLS = 6;
    const POLL_INTERVAL_MS = 5000;

    const verify = async () => {
      if (cancelled) return;
      try {
        const res = await fetch("/api/payments/phonepe/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantTransactionId: mtid, orderId }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data.success) {
          clearCart();
          setStatus("success");
          successRedirectId = setTimeout(() => {
            if (!cancelled) router.replace("/orders/success");
          }, 1200);
          return;
        }

        if (data.status === "PENDING" && pendingPolls < MAX_PENDING_POLLS) {
          pendingPolls += 1;
          setStatus("pending");
          setMessage(
            "Payment is still being processed by your bank. We'll check again in a few seconds...",
          );
          pendingTimeoutId = setTimeout(verify, POLL_INTERVAL_MS);
          return;
        }

        setStatus("failed");
        setMessage(
          data.message ||
            data.error ||
            "Payment was not successful. If money was deducted, it will be auto-refunded by PhonePe.",
        );
      } catch (err: any) {
        if (cancelled) return;
        setStatus("failed");
        setMessage(err.message || "Could not verify payment.");
      }
    };

    verify();

    return () => {
      cancelled = true;
      if (pendingTimeoutId) clearTimeout(pendingTimeoutId);
      if (successRedirectId) clearTimeout(successRedirectId);
    };
  }, [mtid, orderId, router, clearCart]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-primary-dark mb-2">
              Verifying Payment
            </h1>
            <p className="text-sm text-gray-500">
              Please wait while we confirm your PhonePe transaction...
            </p>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-100 flex items-center justify-center">
              <Loader2 className="animate-spin text-amber-600" size={32} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-primary-dark mb-2">
              Payment Pending
            </h1>
            <p className="text-sm text-gray-500">{message}</p>
            <p className="text-xs text-gray-400 mt-3">
              Please do not close this page or pay again.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={36} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-primary-dark mb-2">
              Payment Successful!
            </h1>
            <p className="text-sm text-gray-500">Redirecting to your order...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="text-red-600" size={36} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-primary-dark mb-2">
              Payment Failed
            </h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors"
              >
                <ArrowLeft size={16} /> Try Again
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function PhonePeCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </main>
      }
    >
      <PhonePeCallbackContent />
    </Suspense>
  );
}
