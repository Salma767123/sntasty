"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  MapPin,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  Check,
  User,
  Mail,
  Phone,
  Home,
  Building2,
  MapPinned,
  Ticket,
  Package,
  IndianRupee,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";
import CouponInput from "@/components/CouponInput";
import Link from "next/link";
import { validateForm, checkoutSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

export default function CheckoutClient({
  initialSettings,
  initialShippingRates,
  initialCoupons,
}: {
  initialSettings: any;
  initialShippingRates?: any[];
  initialCoupons?: any[];
}) {
  const { data: session, isPending: status } = authClient.useSession();
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("prepaid");
  const [showSummary, setShowSummary] = useState(false);

  const [address, setAddress] = useState({
    fullName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    pincode: "",
    state: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: string;
    value: number;
    discount: number;
    isFreeDelivery?: boolean;
    description?: string;
  } | null>(null);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState("Home");

  // Redirect admin users away from checkout — admins should not use the customer flow
  useEffect(() => {
    if (!status && session?.user && (session.user as any).role === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

  // Fetch saved addresses and auto-fill defaults
  useEffect(() => {
    if (session?.user && (session.user as any).role !== "admin") {
      setAddress((prev) => ({
        ...prev,
        fullName: session.user?.name || "",
        email: session.user?.email || "",
      }));

      // Fetch saved addresses
      fetch("/api/user/addresses")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSavedAddresses(data);
            // Auto-select default address or first one
            const defaultAddr = data.find((a: any) => a.isDefault) || data[0];
            selectAddress(defaultAddr);
          } else {
            setShowAddressForm(true);
          }
        })
        .catch(() => {
          setShowAddressForm(true);
        });
    } else {
      setShowAddressForm(true);
    }
  }, [session, status]);

  const selectAddress = (addr: any) => {
    setSelectedAddressId(addr._id);
    setShowAddressForm(false);
    setAddress({
      fullName: addr.fullName,
      email: addr.email || session?.user?.email || "",
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      pincode: addr.pincode,
      state: addr.state,
    });
    setFieldErrors({});
  };

  const handleAddNewClick = () => {
    setSelectedAddressId(null);
    setShowAddressForm(true);
    setAddress({
      fullName: session?.user?.name || "",
      email: session?.user?.email || "",
      phone: "",
      street: "",
      city: "",
      pincode: "",
      state: "",
    });
    setFieldErrors({});
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedAddresses(data);
        if (selectedAddressId === id) {
          if (data.length > 0) {
            selectAddress(data[0]);
          } else {
            handleAddNewClick();
          }
        }
        toast.success("Address removed");
      }
    } catch {
      toast.error("Failed to remove address");
    }
  };

  const itemsPrice = cartTotal;

  // Find the matching shipping rate for a state (exact match first, then "Other States" fallback)
  const findShippingRate = () => {
    if (!initialShippingRates || !address.state) return null;

    // Try exact state match first
    const exactMatch = initialShippingRates.find(
      (rate) => rate.location === address.state
    );
    if (exactMatch) return exactMatch;

    // Fallback to "Other States" catch-all
    return initialShippingRates.find(
      (rate) => rate.location === "Other States"
    ) || null;
  };

  // Get estimated delivery time for selected location
  const getEstimatedDelivery = () => {
    return findShippingRate()?.estimatedDelivery || null;
  };

  // Dynamic Shipping Price Logic - Location Based
  const calculateShipping = () => {
    if (appliedCoupon?.isFreeDelivery) return 0;

    if (initialShippingRates && initialShippingRates.length > 0 && address.state) {
      const applicableRate = findShippingRate();

      // If rate found, return it (0 means free delivery)
      if (applicableRate) return applicableRate.rate;

      // No rate found — shipping unavailable for this state
      return null;
    }

    return null;
  };

  const shippingPrice = calculateShipping();
  const discountAmount = appliedCoupon?.discount || 0;
  const estimatedDelivery = getEstimatedDelivery();

  // Check if shipping is available for selected location
  const isShippingAvailable = shippingPrice !== null;

  const totalPrice = Math.max(
    0,
    itemsPrice + (shippingPrice || 0) - discountAmount,
  );

  const applyCouponCode = async (code: string) => {
    if (!session?.user && !address.email.trim()) {
      toast.error("Please enter your email address before applying a coupon.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          orderAmount: itemsPrice,
          guestEmail: !session?.user ? address.email : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to apply coupon");
        return;
      }

      setAppliedCoupon({
        code: data.data.code,
        type: data.data.type,
        value: data.data.value,
        discount: data.data.discount,
        isFreeDelivery: data.data.isFreeDelivery,
        description: data.data.description,
      });
      toast.success("Coupon applied successfully!");
    } catch (err) {
      toast.error("Failed to apply coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const makePayment = async () => {
    const validation = validateForm(checkoutSchema, address);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      toast.error("Please fix the errors in the delivery form.");
      return;
    }
    setFieldErrors({});

    // If guest, check if email belongs to a registered user
    if (!session?.user && address.email) {
      try {
        const checkRes = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: address.email.trim() }),
        });
        const checkData = await checkRes.json();
        if (checkData.exists) {
          toast.error("You already have an account with this email. Please login for a better experience!", { duration: 5000 });
          router.push(`/login?callbackUrl=/checkout`);
          return;
        }
      } catch {
        // If check fails, allow guest checkout to continue
      }
    }

    // Check if shipping is available for selected location
    if (!isShippingAvailable) {
      toast.error(`Sorry, we don't deliver to ${address.state} yet. Please select a different state or contact us.`);
      return;
    }

    setLoading(true);
    try {
      // Prepare order data (will be sent to server only after payment succeeds)
      const orderData = {
        orderItems: cartItems.map((item) => ({
          productId: item._id,
          name: item.name,
          qty: item.qty,
          image: item.image,
          price: item.price,
          uom: item.uom,
        })),
        shippingAddress: {
          fullName: address.fullName,
          email: address.email,
          phone: address.phone,
          address: address.street,
          city: address.city,
          pincode: address.pincode,
          state: address.state,
        },
        paymentMethod: "Razorpay",
        itemsPrice,
        taxPrice: 0,
        shippingPrice,
        discountPrice: discountAmount,
        totalPrice,
        couponCode: appliedCoupon?.code || null,
        discount: discountAmount,
      };

      // 1. Create Razorpay order (no DB order yet)
      const payRes = await fetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalPrice }),
      });
      const rzpOrder = await payRes.json();

      if (!payRes.ok) {
        console.error("Payment API Error:", rzpOrder);
        throw new Error(rzpOrder.error || "Payment initiation failed");
      }

      if (!rzpOrder.id)
        throw new Error("Could not create Razorpay order (ID missing)");

      if (!(window as any).Razorpay) {
        toast.error(
          "Razorpay SDK failed to load. Please check your internet connection.",
        );
        setLoading(false);
        return;
      }

      const options = {
        key: rzpOrder.key,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: initialSettings?.shopName || "Sai Nandhini Tasty World",
        description:
          initialSettings?.seo?.metaDescription ||
          "Authentic South Indian Delicacies",
        order_id: rzpOrder.id,
        handler: async function (response: any) {
          // Payment succeeded — verify and create order in DB
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData,
              }),
            });

            if (verifyRes.ok) {
              // Save address if user opted to and it's a new address
              if (saveAddress && showAddressForm && session?.user) {
                fetch("/api/user/addresses", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    label: addressLabel,
                    fullName: address.fullName,
                    email: address.email,
                    phone: address.phone,
                    street: address.street,
                    city: address.city,
                    pincode: address.pincode,
                    state: address.state,
                    isDefault: savedAddresses.length === 0,
                  }),
                }).catch(() => {});
              }
              clearCart();
              window.location.href = "/orders/success";
            } else {
              const verifyData = await verifyRes.json();
              toast.error(
                `Payment verification failed: ${verifyData.error || "Unknown error"}`,
              );
              setLoading(false);
            }
          } catch (verifyErr) {
            toast.error("Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone,
        },
        theme: { color: "#234d1b" },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.error("Payment cancelled.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error(
          `Payment Failed: ${response.error.description || "Unknown error"}`,
        );
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Checkout failed", err);
      toast.error("Checkout initialization failed: " + err.message);
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-white relative z-0 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mx-auto">
            <Loader2 size={48} className="animate-spin-slow" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary-dark">
            Your cart is empty
          </h1>
          <Link
            href="/shop"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} /> Return to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative z-0">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="pt-44 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between relative">
              {/* Background Line */}
              <div className="absolute top-5 md:top-6 left-0 right-0 h-0.5 bg-gray-200" />
              <div className="absolute top-5 md:top-6 left-0 w-1/2 h-0.5 bg-primary transition-all duration-500" />

              {/* Step 1 - Active */}
              <div className="flex flex-col items-center relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg ring-4 ring-primary/20"
                >
                  <MapPin size={18} className="md:w-5 md:h-5" />
                </motion.div>
                <span className="text-[10px] md:text-xs font-semibold text-primary mt-2 md:mt-3">
                  Delivery
                </span>
              </div>

              {/* Step 2 - Pending */}
              <div className="flex flex-col items-center relative z-10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center shadow-sm">
                  <CreditCard size={18} className="md:w-5 md:h-5" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-400 mt-2 md:mt-3">
                  Payment
                </span>
              </div>

              {/* Step 3 - Pending */}
              <div className="flex flex-col items-center relative z-10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center shadow-sm">
                  <Check size={18} className="md:w-5 md:h-5" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-400 mt-2 md:mt-3">
                  Complete
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary to-primary-dark px-5 md:px-8 py-4 md:py-6">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <MapPin className="text-white" size={18} />
                  </div>
                  Delivery Information
                </h2>
                <p className="text-white/80 text-xs md:text-sm mt-1 md:mt-2">
                  Where should we deliver your order?
                </p>
              </div>

              <div className="p-5 md:p-8 space-y-4 md:space-y-6">
                {/* Saved Addresses */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Saved Addresses
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr._id}
                          onClick={() => selectAddress(addr)}
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all group ${
                            selectedAddressId === addr._id && !showAddressForm
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-gray-200 hover:border-primary/40 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                selectedAddressId === addr._id && !showAddressForm
                                  ? "border-primary"
                                  : "border-gray-300"
                              }`}>
                                {selectedAddressId === addr._id && !showAddressForm && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {addr.label || "Home"}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(addr._id);
                              }}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {addr.fullName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {addr.street}, {addr.city} - {addr.pincode}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {addr.state} | {addr.phone}
                          </p>
                        </div>
                      ))}

                      {/* Add New Address Card */}
                      <div
                        onClick={handleAddNewClick}
                        className={`p-4 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[120px] transition-all ${
                          showAddressForm
                            ? "border-primary bg-primary/5"
                            : "border-gray-300 hover:border-primary/40 bg-gray-50/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          showAddressForm ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                        }`}>
                          <Plus size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-500">
                          Add New Address
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Form */}
                <AnimatePresence mode="wait">
                  {showAddressForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {savedAddresses.length > 0 && (
                        <div className="border-t border-gray-100 pt-5 mb-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            New Address Details
                          </p>
                        </div>
                      )}

              <form className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={address.fullName}
                        onChange={(e) => {
                          setAddress({ ...address, fullName: e.target.value });
                          setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                        }}
                        placeholder="Enter your full name"
                        className={`w-full border-2 ${fieldErrors.fullName ? "border-red-300" : "border-gray-200"} rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm bg-gray-50 focus:bg-white`}
                      />
                      <FormError message={fieldErrors.fullName} />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={address.email}
                        onChange={(e) => {
                          setAddress({ ...address, email: e.target.value });
                          setFieldErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        placeholder="your@email.com"
                        className={`w-full border-2 ${fieldErrors.email ? "border-red-300" : "border-gray-200"} rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm bg-gray-50 focus:bg-white`}
                      />
                      <FormError message={fieldErrors.email} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={address.phone}
                        onChange={(e) => {
                          setAddress({ ...address, phone: e.target.value });
                          setFieldErrors((prev) => ({ ...prev, phone: "" }));
                        }}
                        placeholder="+91 XXXXX XXXXX"
                        className={`w-full border-2 ${fieldErrors.phone ? "border-red-300" : "border-gray-200"} rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm bg-gray-50 focus:bg-white`}
                      />
                      <FormError message={fieldErrors.phone} />
                    </div>
                  </div>

                  {/* Street Address */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Home className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <textarea
                        rows={3}
                        required
                        value={address.street}
                        onChange={(e) => {
                          setAddress({ ...address, street: e.target.value });
                          setFieldErrors((prev) => ({ ...prev, street: "" }));
                        }}
                        placeholder="House number, building name, street name"
                        className={`w-full border-2 ${fieldErrors.street ? "border-red-300" : "border-gray-200"} rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm resize-none bg-gray-50 focus:bg-white`}
                      />
                      <FormError message={fieldErrors.street} />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      City / Town <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={address.city}
                        onChange={(e) => {
                          setAddress({ ...address, city: e.target.value });
                          setFieldErrors((prev) => ({ ...prev, city: "" }));
                        }}
                        placeholder="Enter city"
                        className={`w-full border-2 ${fieldErrors.city ? "border-red-300" : "border-gray-200"} rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm bg-gray-50 focus:bg-white`}
                      />
                      <FormError message={fieldErrors.city} />
                    </div>
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPinned className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={address.pincode}
                        onChange={(e) => {
                          setAddress({ ...address, pincode: e.target.value });
                          setFieldErrors((prev) => ({ ...prev, pincode: "" }));
                        }}
                        placeholder="6-digit pincode"
                        className={`w-full border-2 ${fieldErrors.pincode ? "border-red-300" : "border-gray-200"} rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm bg-gray-50 focus:bg-white`}
                      />
                      <FormError message={fieldErrors.pincode} />
                    </div>
                  </div>

                  {/* State */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        required
                        value={address.state}
                        onChange={(e) => {
                          setAddress({ ...address, state: e.target.value });
                          setFieldErrors((prev) => ({ ...prev, state: "" }));
                        }}
                        className={`w-full border-2 ${fieldErrors.state ? "border-red-300" : "border-gray-200"} rounded-xl py-3 pl-12 pr-10 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm bg-gray-50 focus:bg-white appearance-none`}
                      >
                        <option value="">Select State</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                        <option value="Ladakh">Ladakh</option>
                        <option value="Lakshadweep">Lakshadweep</option>
                        <option value="Puducherry">Puducherry</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <FormError message={fieldErrors.state} />
                    </div>
                  </div>
                </div>

                {/* Save Address Option */}
                {session?.user && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-600">
                        Save this address
                      </span>
                    </label>
                    {saveAddress && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">as</span>
                        {["Home", "Office", "Other"].map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setAddressLabel(lbl)}
                            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                              addressLabel === lbl
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Payment Method Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary to-primary-dark px-5 md:px-8 py-4 md:py-6">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="text-white" size={18} />
                  </div>
                  Payment Method
                </h2>
                <p className="text-white/80 text-xs md:text-sm mt-1 md:mt-2">
                  Choose your preferred payment option
                </p>
              </div>

              <div className="p-5 md:p-8 space-y-4">
                {/* Online Payment Option */}
                <label
                  className={`group flex items-start gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "prepaid"
                      ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                >
                  <div className="flex items-center h-6">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${paymentMethod === "prepaid"
                          ? "border-primary bg-primary"
                          : "border-gray-300 group-hover:border-gray-400"
                        }`}
                    >
                      {paymentMethod === "prepaid" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 rounded-full bg-white"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <p className="font-bold text-primary-dark text-lg">
                        Online Payment
                      </p>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Pay securely using Cards, UPI, Net Banking & more
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1.5">
                        💳 Cards
                      </span>
                      <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1.5">
                        📱 UPI
                      </span>
                      <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1.5">
                        🏦 Net Banking
                      </span>
                      <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1.5">
                        💰 Wallets
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    className="hidden"
                    checked={paymentMethod === "prepaid"}
                    onChange={() => setPaymentMethod("prepaid")}
                  />
                </label>


              </div>
            </motion.div>

            {/* Security Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-900">
                    SSL Encrypted
                  </p>
                  <p className="text-xs text-green-700">100% Secure</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">
                    Verified Seller
                  </p>
                  <p className="text-xs text-blue-700">Trusted Origin</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-900">
                    Safe Payment
                  </p>
                  <p className="text-xs text-purple-700">PCI Compliant</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Order Summary */}
          <aside className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 sticky top-24 overflow-hidden"
            >
              {/* Summary Header with Gradient */}
              <div className="bg-gradient-to-r from-[#f8bf51] to-[#d4b876] px-5 md:px-8 py-4 md:py-6">
                <h2 className="text-lg md:text-xl font-bold text-white">
                  Order Summary
                </h2>
                <p className="text-white/80 text-xs md:text-sm mt-1">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                </p>
              </div>

              <div className="p-6 space-y-6 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
                {/* Items List */}
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg bg-white overflow-hidden flex-shrink-0 relative shadow-sm">
                        <Image
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          fill
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-sm font-semibold text-primary-dark line-clamp-2 mb-2">
                          {item.name}
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-md">
                            Qty: {item.qty}
                          </span>
                          <span className="text-sm font-bold text-primary">
                            ₹{(item.price * item.qty).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      Subtotal
                    </span>
                    <span className="font-semibold text-primary-dark">
                      ₹{itemsPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* Shipping Progress Bar — only when freeShippingThreshold is configured */}
                  {shippingPrice > 0 && initialSettings?.freeShippingThreshold > 0 && (
                    <div className="pt-2 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <span>Free Shipping Progress</span>
                        <span>
                          {Math.min(
                            100,
                            Math.round(
                              (itemsPrice / initialSettings.freeShippingThreshold) * 100,
                            ),
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      Shipping
                    </span>
                    {shippingPrice === null ? (
                      <span className="text-red-500 font-semibold text-xs">
                        {address.state ? "Not Available" : "Select State"}
                      </span>
                    ) : (
                      <span
                        className={`font-semibold ${shippingPrice === 0
                            ? "text-green-600"
                            : "text-primary-dark"
                          }`}
                      >
                        {shippingPrice === 0 ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={14} /> FREE
                          </span>
                        ) : (
                          `₹${shippingPrice}`
                        )}
                      </span>
                    )}
                  </div>

                  {/* Show delivery estimate if available */}
                  {estimatedDelivery && shippingPrice !== null && (
                    <div className="flex justify-between text-xs text-gray-500 -mt-2">
                      <span>Estimated Delivery</span>
                      <span className="font-medium">{estimatedDelivery}</span>
                    </div>
                  )}

                  {/* Show warning if shipping not available */}
                  {shippingPrice === null && address.state && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                      <p className="font-semibold mb-1">⚠️ Delivery Not Available</p>
                      <p>We don't deliver to {address.state} yet. Please select a different state or contact us.</p>
                    </div>
                  )}

                  {/* Coupon Section */}
                  <div className="pt-4 border-t border-gray-200 space-y-4">
                    <CouponInput
                      orderAmount={itemsPrice}
                      onApplyCoupon={setAppliedCoupon}
                      onRemoveCoupon={() => setAppliedCoupon(null)}
                      appliedCoupon={appliedCoupon}
                    />

                    {/* Available Coupons List */}
                    {!appliedCoupon &&
                      initialCoupons &&
                      initialCoupons.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Available Coupons
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {initialCoupons
                              .filter(
                                (c) =>
                                  c.isActive &&
                                  c.displayInCheckout &&
                                  (!c.expiresAt ||
                                    new Date(c.expiresAt) > new Date()) &&
                                  (c.usageLimit === undefined ||
                                    (c.usedCount || 0) < c.usageLimit),
                              )
                              .map((coupon) => (
                                <button
                                  key={coupon._id}
                                  onClick={() => applyCouponCode(coupon.code)}
                                  disabled={loading}
                                  className="group bg-[#ece0cc] hover:bg-primary/5 border border-gray-200 hover:border-primary/30 py-2 px-3 rounded-xl transition-all text-left disabled:opacity-50"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-primary tracking-wider uppercase">
                                      {coupon.code}
                                    </span>
                                    <Ticket
                                      size={10}
                                      className="text-primary/50"
                                    />
                                  </div>
                                  <p className="text-[10px] text-gray-500 line-clamp-1 group-hover:text-gray-700">
                                    {coupon.description ||
                                      (coupon.discountType === "percentage"
                                        ? `${coupon.discountValue}% OFF`
                                        : coupon.discountType === "fixed"
                                          ? `₹${coupon.discountValue} OFF`
                                          : "Free Delivery")}
                                  </p>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Discount Display */}
                  {discountAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-between text-sm p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
                    >
                      <span className="text-green-700 font-semibold flex items-center gap-2">
                        <Ticket size={16} />
                        Discount ({appliedCoupon?.code})
                      </span>
                      <span className="text-green-700 font-bold">
                        -₹{discountAmount.toFixed(2)}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent" />

                {/* Total Amount */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
                    <span className="text-gray-700 font-semibold">
                      Total Amount
                    </span>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">
                        ₹{totalPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Inclusive of all taxes
                      </p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={makePayment}
                    disabled={loading || !isShippingAvailable}
                    className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-base transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Processing...
                      </>
                    ) : !isShippingAvailable ? (
                      <>
                        Delivery Not Available
                      </>
                    ) : (
                      <>
                        {paymentMethod === "cod"
                          ? "Place Order"
                          : "Proceed to Payment"}
                        <ChevronRight
                          size={20}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <ShieldCheck size={14} className="text-green-600" />
                    <span className="font-semibold">
                      100% Secure & Encrypted Payment
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>

      {/* Floating Sticky Summary for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[50] pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="flex items-center gap-2 text-xs font-bold text-primary-dark uppercase tracking-widest"
            >
              Order Details {showSummary ? "↓" : "↑"}
            </button>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">
                Total Amount
              </p>
              <p className="text-lg font-black text-primary">
                ₹{totalPrice.toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={makePayment}
            disabled={loading || !isShippingAvailable}
            className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : !isShippingAvailable ? (
              <>
                Delivery Not Available
              </>
            ) : paymentMethod === "cod" ? (
              <>
                Confirm COD Order <ChevronRight size={18} />
              </>
            ) : (
              <>
                Proceed To Secure Pay <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Expandable Summary Overlay */}
        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-gray-50 border-t border-gray-100"
            >
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-gray-600 line-clamp-1 flex-grow pr-4">
                      {item.name} x {item.qty}
                    </span>
                    <span className="font-bold text-primary-dark shrink-0">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="h-px bg-gray-200" />
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="font-bold">
                      ₹{itemsPrice.toLocaleString()}
                    </span>
                  </div>
                  {shippingPrice !== null && shippingPrice > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Shipping</span>
                      <span className="font-bold">
                        ₹{shippingPrice.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {shippingPrice === 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Shipping</span>
                      <span className="font-bold text-green-600">FREE</span>
                    </div>
                  )}
                  {shippingPrice === null && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Shipping</span>
                      <span className="font-bold text-red-500">Not Available</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Discount</span>
                      <span className="font-bold">
                        -₹{discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer for Floating Summary on Mobile */}
      <div className="h-32 lg:hidden" />

      <Footer />
    </main>
  );
}
