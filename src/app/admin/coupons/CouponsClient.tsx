"use client";

import { useEffect, useState } from "react";
import {
  Plus,

  Pencil,
  Trash2,
  Percent,
  IndianRupee,
  Truck,
  Activity,
  Calendar,
  Ticket,
  Loader2,
  ShoppingCart,
  X,
  Save,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { validateForm, couponSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

export default function CouponsClient({ initialData }: { initialData: any[] }) {
  const [coupons, setCoupons] = useState<any[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modals state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [currentCoupon, setCurrentCoupon] = useState<{
    _id?: string;
    code: string;
    discountType: "percentage" | "fixed" | "free-delivery";
    discountValue: number;
    minOrderValue: number;
    isActive: boolean;
    displayInCheckout: boolean;
    description: string;
    maxDiscountAmount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    expiresAt?: string;
  }>({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    minOrderValue: 0,
    isActive: true,
    displayInCheckout: true,
    description: "",
    maxDiscountAmount: 0,
    usageLimit: undefined,
    perUserLimit: undefined,
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data);
    } catch (error) {
      console.error("Failed to fetch coupons", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      } else {
        toast.error("Failed to delete coupon");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete coupon");
    } finally {
      setIsActionLoading(false);
      setDeleteId(null);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(couponSchema, {
      code: currentCoupon.code,
      discountType: currentCoupon.discountType,
      discountValue: currentCoupon.discountValue,
      minOrderValue: currentCoupon.minOrderValue,
      description: currentCoupon.description,
    });
    if (!validation.success) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    setIsActionLoading(true);
    try {
      const url = currentCoupon._id
        ? `/api/admin/coupons/${currentCoupon._id}`
        : "/api/admin/coupons";
      const method = currentCoupon._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCoupon.code.toUpperCase(),
          discountType: currentCoupon.discountType,
          discountValue: currentCoupon.discountValue,
          minOrderValue: currentCoupon.minOrderValue,
          maxDiscountAmount: currentCoupon.maxDiscountAmount || undefined,
          usageLimit: currentCoupon.usageLimit || undefined,
          perUserLimit: currentCoupon.perUserLimit || undefined,
          expiresAt: currentCoupon.expiresAt
            ? new Date(currentCoupon.expiresAt)
            : undefined,
          isActive: currentCoupon.isActive,
          displayInCheckout: currentCoupon.displayInCheckout,
          description: currentCoupon.description,
        }),
      });

      if (res.ok) {
        toast.success(
          `Coupon ${currentCoupon._id ? "updated" : "created"} successfully`,
        );
        setIsDialogOpen(false);
        fetchCoupons();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save coupon");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save coupon");
    } finally {
      setIsActionLoading(false);
    }
  };


  const openAddDialog = () => {
    setCurrentCoupon({
      code: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderValue: 0,
      isActive: true,
      displayInCheckout: true,
      description: "",
      maxDiscountAmount: 0,
      usageLimit: undefined,
      perUserLimit: undefined,
      expiresAt: "",
    });
    setFieldErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (coupon: any) => {
    setCurrentCoupon({
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue || 0,
      minOrderValue: coupon.minOrderValue || 0,
      isActive: coupon.isActive,
      displayInCheckout: coupon.displayInCheckout !== false,
      description: coupon.description || "",
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().split("T")[0]
        : "",
    });
    setFieldErrors({});
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-gray-400 font-medium">Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[3rem] bg-white border border-gray-100 p-5 sm:p-10 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[8px] sm:text-[10px] block mb-2">
                Marketing Tools
              </span>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-black text-primary-dark text-balance leading-none sm:leading-tight">
                Coupon Manager
              </h1>
            </div>
            <p className="text-gray-400 text-[10px] sm:text-sm max-w-xl font-medium">
              Create and manage promotional codes to drive sales.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={openAddDialog}
              className="bg-primary text-white px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 active:scale-95 text-[10px] uppercase tracking-widest focus:ring-4 focus:ring-primary/10 touch-manipulation w-full sm:w-auto"
            >
              <Plus size={16} className="shrink-0" />
              New Coupon
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 flex items-center gap-5 sm:gap-6 shadow-sm">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
            <Ticket size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">
              Total
            </p>
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-primary-dark tabular-nums truncate">
              {coupons.length}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 flex items-center gap-5 sm:gap-6 shadow-sm">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-green-600 shrink-0 transition-transform group-hover:scale-110">
            <Activity size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">
              Active
            </p>
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-primary-dark tabular-nums truncate">
              {coupons.filter((c) => c.isActive).length}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 flex items-center gap-5 sm:gap-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-orange-600 shrink-0 transition-transform group-hover:scale-110">
            <ShoppingCart size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">
              Used
            </p>
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-primary-dark tabular-nums truncate">
              {coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0)}
            </h3>
          </div>
        </div>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 flex flex-col items-center">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-6">
            <Ticket size={40} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-primary-dark mb-2 text-balance">
            No Active Coupons
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm">
            Create discount codes to boost sales and reward customers.
          </p>
          <button
            onClick={openAddDialog}
            className="border-2 border-primary/20 text-primary px-8 py-3 rounded-2xl font-bold hover:bg-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
          >
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {coupons.map((coupon) => (
              <motion.div
                key={coupon._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 group hover:border-primary/20 transition-all flex flex-col overflow-hidden"
              >
                <div className="p-6 border-b border-gray-50 flex justify-between items-start bg-gray-50/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-lg">
                        {coupon.code}
                      </span>
                      {!coupon.isActive && (
                        <span className="bg-gray-100 text-gray-500 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-medium line-clamp-1 mt-2">
                      {coupon.description || "No description provided"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditDialog(coupon)}
                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                      title="Edit Coupon"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(coupon._id)}
                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                      title="Delete Coupon"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5 flex-1 bg-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">
                        Discount
                      </p>
                      <div className="flex items-center gap-1.5 font-black text-lg sm:text-2xl text-primary-dark tabular-nums truncate">
                        {coupon.discountType === "percentage" ? (
                          <>
                            {coupon.discountValue}
                            <Percent
                              size={14}
                              className="text-primary sm:w-5 sm:h-5"
                            />
                          </>
                        ) : coupon.discountType === "fixed" ? (
                          <>
                            <IndianRupee
                              size={14}
                              className="text-[#f8bf51] sm:w-5 sm:h-5"
                            />
                            {coupon.discountValue}
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-primary">
                            <Truck size={14} className="shrink-0" />
                            <span className="text-[10px] sm:text-xs">
                              Free Del.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 min-w-0 text-right md:text-left">
                      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">
                        Min. Order
                      </p>
                      <div className="flex items-center justify-end md:justify-start gap-1 sm:gap-1.5 font-black text-lg sm:text-2xl text-gray-500 tabular-nums truncate">
                        <IndianRupee
                          size={14}
                          className="text-gray-200 sm:w-4 sm:h-4"
                        />
                        {coupon.minOrderValue || 0}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50 space-y-2">
                    <div className="flex justify-between items-center text-xs font-medium text-gray-500 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <Activity size={14} className="text-gray-300" />
                        Total Used: {coupon.usedCount || 0} /{" "}
                        {coupon.usageLimit || "∞"}
                      </div>
                      {coupon.expiresAt && (
                        <div className="flex items-center gap-1.5 text-orange-500/80">
                          <Calendar size={14} />
                          {mounted
                            ? new Date(coupon.expiresAt).toLocaleDateString(
                              undefined,
                              { day: "numeric", month: "short" },
                            )
                            : "..."}
                        </div>
                      )}
                    </div>
                    {coupon.perUserLimit && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          Per User:
                        </span>
                        <span className="text-gray-600">
                          {coupon.perUserLimit} use
                          {coupon.perUserLimit > 1 ? "s" : ""} max
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Shared backdrop for both modals */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            {/* Create/Edit Modal */}
            {isDialogOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-[95%] md:w-full max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative"
              >
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#ece0cc]">
                  <div>
                    <h2 className="text-2xl font-serif font-black text-primary-dark">
                      {currentCoupon._id ? "Edit Coupon" : "Create New Coupon"}
                    </h2>
                    <p className="text-xs font-medium text-gray-400 mt-1">
                      Configure your discount code settings below.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-y-auto px-8 py-6 flex-1 custom-scrollbar">
                  <form
                    id="coupon-form"
                    onSubmit={handleSaveCoupon}
                    className="space-y-6 pb-4"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Coupon Code
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={currentCoupon.code}
                          onChange={(e) => {
                            setCurrentCoupon({
                              ...currentCoupon,
                              code: e.target.value.toUpperCase(),
                            });
                            setFieldErrors((prev) => ({ ...prev, code: "" }));
                          }}
                          className="w-full bg-[#ece0cc] border-none focus:ring-2 focus:ring-primary/20 rounded-2xl py-4 pl-12 pr-6 outline-none transition-shadow font-black text-lg uppercase tracking-wider text-primary-dark placeholder:text-gray-300"
                          placeholder="SUMMER2026"
                        />
                        <Ticket
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"
                          size={20}
                        />
                      </div>
                      <FormError message={fieldErrors.code} />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                          Discount Type
                        </label>
                        <div className="relative">
                          <select
                            value={currentCoupon.discountType}
                            onChange={(e: any) =>
                              setCurrentCoupon({
                                ...currentCoupon,
                                discountType: e.target.value,
                              })
                            }
                            className="w-full bg-[#ece0cc] border-none focus:ring-2 focus:ring-primary/20 rounded-2xl py-4 px-6 pr-12 outline-none transition-colors font-medium text-gray-700 appearance-none cursor-pointer"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (₹)</option>
                            <option value="free-delivery">Free Delivery</option>
                          </select>
                          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {currentCoupon.discountType !== "free-delivery" && (
                        <div className="space-y-2 animate-in fade-in">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                            Discount Value
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                              {currentCoupon.discountType === "percentage" ? (
                                <Percent size={18} />
                              ) : (
                                <IndianRupee size={18} />
                              )}
                            </span>
                            <input
                              type="number"
                              required
                              value={currentCoupon.discountValue || ""}
                              onChange={(e) => {
                                setCurrentCoupon({
                                  ...currentCoupon,
                                  discountValue: Number(e.target.value),
                                });
                                setFieldErrors((prev) => ({ ...prev, discountValue: "" }));
                              }}
                              className="w-full bg-[#ece0cc] border-none focus:ring-2 focus:ring-primary/20 rounded-2xl py-4 pl-12 pr-6 outline-none transition-shadow font-bold text-gray-700"
                              placeholder="20"
                            />
                          </div>
                          <FormError message={fieldErrors.discountValue} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Min. Order Value
                      </label>
                      <div className="relative">
                        <IndianRupee
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="number"
                          value={currentCoupon.minOrderValue || ""}
                          onChange={(e) =>
                            setCurrentCoupon({
                              ...currentCoupon,
                              minOrderValue: Number(e.target.value),
                            })
                          }
                          className="w-full bg-[#ece0cc] border-none focus:ring-2 focus:ring-primary/20 rounded-2xl py-4 pl-12 pr-6 outline-none transition-shadow font-bold text-gray-700"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                          Usage Limit
                        </label>
                        <input
                          type="number"
                          value={currentCoupon.usageLimit || ""}
                          onChange={(e) =>
                            setCurrentCoupon({
                              ...currentCoupon,
                              usageLimit: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          className="w-full bg-[#ece0cc] border-none focus:ring-2 focus:ring-primary/20 rounded-2xl py-4 px-6 outline-none transition-shadow font-bold text-gray-700"
                          placeholder="∞"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                          Per User Limit
                        </label>
                        <input
                          type="number"
                          value={currentCoupon.perUserLimit || ""}
                          onChange={(e) =>
                            setCurrentCoupon({
                              ...currentCoupon,
                              perUserLimit: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          className="w-full bg-[#ece0cc] border-none focus:ring-2 focus:ring-primary/20 rounded-2xl py-4 px-6 outline-none transition-shadow font-bold text-gray-700"
                          placeholder="∞"
                        />
                      </div>
                    </div>

                    {currentCoupon.discountType === "percentage" && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                          Max Discount Amount (₹)
                        </label>
                        <div className="relative">
                          <IndianRupee
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <input
                            type="number"
                            value={currentCoupon.maxDiscountAmount || ""}
                            onChange={(e) =>
                              setCurrentCoupon({
                                ...currentCoupon,
                                maxDiscountAmount: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              })
                            }
                            className="w-full bg-[#ece0cc] border-none focus:ring-2 focus:ring-primary/20 rounded-2xl py-4 pl-12 pr-6 outline-none transition-shadow font-bold text-gray-700"
                            placeholder="No limit"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={currentCoupon.expiresAt}
                        onChange={(e) =>
                          setCurrentCoupon({
                            ...currentCoupon,
                            expiresAt: e.target.value,
                          })
                        }
                        className="w-full bg-[#ece0cc] border-none focus:ring-2 focus:ring-primary/20 rounded-2xl py-4 px-6 outline-none transition-shadow font-bold text-gray-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={currentCoupon.description}
                        onChange={(e) =>
                          setCurrentCoupon({
                            ...currentCoupon,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-[#ece0cc] border-none focus:ring-2 focus:ring-primary/20 rounded-2xl py-4 px-6 outline-none transition-shadow font-bold text-gray-700"
                        placeholder="E.g. Diwali Special"
                      />
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 bg-[#ece0cc] py-4 px-6 rounded-2xl cursor-pointer flex-1 border border-transparent hover:border-primary/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={currentCoupon.isActive}
                          onChange={(e) =>
                            setCurrentCoupon({
                              ...currentCoupon,
                              isActive: e.target.checked,
                            })
                          }
                          className="w-5 h-5 accent-primary rounded cursor-pointer"
                        />
                        <span className="text-sm font-bold text-gray-700">
                          Active Status
                        </span>
                      </label>

                      <label className="flex items-center gap-3 bg-[#ece0cc] py-4 px-6 rounded-2xl cursor-pointer flex-1 border border-transparent hover:border-primary/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={currentCoupon.displayInCheckout}
                          onChange={(e) =>
                            setCurrentCoupon({
                              ...currentCoupon,
                              displayInCheckout: e.target.checked,
                            })
                          }
                          className="w-5 h-5 accent-primary rounded cursor-pointer"
                        />
                        <span className="text-sm font-bold text-gray-700">
                          Show in Checkout
                        </span>
                      </label>
                    </div>
                  </form>
                </div>

                <div className="p-8 border-t border-gray-100 bg-gray-50 flex gap-4">
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="coupon-form"
                    disabled={isActionLoading}
                    className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-colors shadow-xl active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                  >
                    {isActionLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    {currentCoupon._id ? "Update Coupon" : "Create Coupon"}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
