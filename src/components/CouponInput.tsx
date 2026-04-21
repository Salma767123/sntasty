"use client";

import { useState } from "react";
import { Ticket, AlertCircle, CheckCircle, Loader2, X } from "lucide-react";

interface CouponInputProps {
  orderAmount: number;
  onApplyCoupon: (coupon: {
    code: string;
    type: string;
    value: number;
    discount: number;
    isFreeDelivery?: boolean;
    description?: string;
  }) => void;
  onRemoveCoupon: () => void;
  appliedCoupon?: {
    code: string;
    type: string;
    value: number;
    discount: number;
    isFreeDelivery?: boolean;
    description?: string;
  } | null;
}

export default function CouponInput({
  orderAmount,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to apply coupon");
        return;
      }

      const message = data.data.isFreeDelivery
        ? "Free Delivery coupon applied! Shipping charge waived."
        : `Coupon applied! You save ₹${data.data.discount}`;

      setSuccess(message);
      onApplyCoupon({
        code: data.data.code,
        type: data.data.type,
        value: data.data.value,
        discount: data.data.discount,
        isFreeDelivery: data.data.isFreeDelivery,
        description: data.data.description,
      });
      setCouponCode("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">
                Coupon Applied: {appliedCoupon.code}
              </p>
              <p className="text-sm text-green-700 mt-1">
                {appliedCoupon.isFreeDelivery
                  ? "Free Delivery Activated"
                  : `Savings: ₹${appliedCoupon.discount.toFixed(2)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onRemoveCoupon}
            className="p-1 hover:bg-green-100 rounded transition-colors flex-shrink-0"
            title="Remove coupon"
          >
            <X className="h-4 w-4 text-green-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Enter promo code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={loading}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-[#f8bf51] focus:ring-2 focus:ring-[#f8bf51]/20 transition-all disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!couponCode.trim() || loading}
          className="px-4 py-2 bg-[#234d1b] text-white rounded-lg font-medium text-sm hover:bg-[#234d1b] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
    </form>
  );
}
