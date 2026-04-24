"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Lock,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Home,
  Building2,
  Phone,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { validateForm, passwordResetSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

export default function ProfileClient() {
  const { data: session, isPending: status } = authClient.useSession();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    street: "",
    city: "",
    pincode: "",
    state: "",
  });
  const [addressErrors, setAddressErrors] = useState<FieldErrors>({});

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
        if (session?.user?.image) {
          setIsGoogleLinked(true);
        }
      }
    };
    if (session) checkLinkedAccounts();
  }, [session]);

  // Fetch saved addresses
  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/addresses")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setSavedAddresses(data);
        })
        .catch(() => {})
        .finally(() => setAddressLoading(false));
    }
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

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const errors: FieldErrors = {};
    if (!newAddress.fullName.trim()) errors.fullName = "Name is required";
    if (!newAddress.phone.trim()) errors.phone = "Phone is required";
    if (!newAddress.street.trim()) errors.street = "Street is required";
    if (!newAddress.city.trim()) errors.city = "City is required";
    if (!newAddress.pincode.trim()) errors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(newAddress.pincode)) errors.pincode = "Must be 6 digits";
    if (!newAddress.state) errors.state = "State is required";

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }
    setAddressErrors({});

    setSavingAddress(true);
    try {
      const isEdit = !!editingAddressId;
      const res = await fetch("/api/user/addresses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAddress,
          ...(isEdit ? { id: editingAddressId } : {}),
          email: session?.user?.email || "",
          isDefault: !isEdit && savedAddresses.length === 0,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedAddresses(data);
        setShowAddForm(false);
        setEditingAddressId(null);
        setNewAddress({ label: "Home", fullName: "", phone: "", street: "", city: "", pincode: "", state: "" });
        toast.success(isEdit ? "Address updated" : "Address saved");
      } else {
        toast.error(data.error || "Failed to save address");
      }
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddressId(addr._id);
    setShowAddForm(true);
    setNewAddress({
      label: addr.label || "Home",
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      pincode: addr.pincode,
      state: addr.state,
    });
    setAddressErrors({});
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedAddresses(data);
        toast.success("Address removed");
      }
    } catch {
      toast.error("Failed to remove address");
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

  const INPUT_CLASS = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors focus:bg-white text-sm";

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

          {/* Google Link Status */}
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

        <div className="space-y-6">
          {/* Saved Addresses Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 md:p-8 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary-dark">
                    Saved Addresses
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Manage your delivery addresses
                  </p>
                </div>
              </div>
              {!showAddForm && (
                <button
                  onClick={() => {
                    setEditingAddressId(null);
                    setShowAddForm(true);
                    setNewAddress({
                      label: "Home",
                      fullName: session?.user?.name || "",
                      phone: "",
                      street: "",
                      city: "",
                      pincode: "",
                      state: "",
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-primary-dark transition-colors shadow-sm"
                >
                  <Plus size={14} /> Add Address
                </button>
              )}
            </div>

            {/* Address Cards */}
            {addressLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : savedAddresses.length === 0 && !showAddForm ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1">No saved addresses</p>
                <p className="text-xs text-gray-400 mb-4">Add an address for faster checkout</p>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setNewAddress({
                      label: "Home",
                      fullName: session?.user?.name || "",
                      phone: "",
                      street: "",
                      city: "",
                      pincode: "",
                      state: "",
                    });
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-primary-dark transition-colors"
                >
                  <Plus size={14} /> Add Your First Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="relative p-5 rounded-xl border border-gray-200 bg-gray-50/50 group hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                        {addr.label || "Home"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      {addr.fullName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {addr.street}
                    </p>
                    <p className="text-xs text-gray-500">
                      {addr.city} - {addr.pincode}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {addr.state}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                      <Phone size={12} />
                      <span className="font-medium">{addr.phone}</span>
                    </div>

                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleEditAddress(addr)}
                        className="p-2 text-gray-300 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Address Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <form
                    onSubmit={handleSaveAddress}
                    className={`${savedAddresses.length > 0 ? "mt-6 pt-6 border-t border-gray-100" : ""}`}
                  >
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      {editingAddressId ? "Edit Address" : "New Address"}
                    </p>

                    {/* Label Selector */}
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-xs text-gray-500 font-medium">Label:</span>
                      {["Home", "Office", "Other"].map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setNewAddress({ ...newAddress, label: lbl })}
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                            newAddress.label === lbl
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {lbl === "Home" ? <Home size={12} /> : lbl === "Office" ? <Building2 size={12} /> : <MapPin size={12} />}
                          {lbl}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-[#234d1b]/70 mb-1.5 uppercase tracking-widest text-[10px]">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={newAddress.fullName}
                          onChange={(e) => {
                            setNewAddress({ ...newAddress, fullName: e.target.value });
                            setAddressErrors((prev) => ({ ...prev, fullName: "" }));
                          }}
                          className={`${INPUT_CLASS} ${addressErrors.fullName ? "border-red-300" : ""}`}
                          placeholder="Receiver's full name"
                        />
                        <FormError message={addressErrors.fullName} />
                      </div>
                      <div>
                        <label className="block font-bold text-[#234d1b]/70 mb-1.5 uppercase tracking-widest text-[10px]">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={newAddress.phone}
                          onChange={(e) => {
                            setNewAddress({ ...newAddress, phone: e.target.value });
                            setAddressErrors((prev) => ({ ...prev, phone: "" }));
                          }}
                          className={`${INPUT_CLASS} ${addressErrors.phone ? "border-red-300" : ""}`}
                          placeholder="+91 XXXXX XXXXX"
                        />
                        <FormError message={addressErrors.phone} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-[#234d1b]/70 mb-1.5 uppercase tracking-widest text-[10px]">
                          Street Address *
                        </label>
                        <textarea
                          rows={2}
                          value={newAddress.street}
                          onChange={(e) => {
                            setNewAddress({ ...newAddress, street: e.target.value });
                            setAddressErrors((prev) => ({ ...prev, street: "" }));
                          }}
                          className={`${INPUT_CLASS} resize-none ${addressErrors.street ? "border-red-300" : ""}`}
                          placeholder="House number, building, street"
                        />
                        <FormError message={addressErrors.street} />
                      </div>
                      <div>
                        <label className="block font-bold text-[#234d1b]/70 mb-1.5 uppercase tracking-widest text-[10px]">
                          City *
                        </label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => {
                            setNewAddress({ ...newAddress, city: e.target.value });
                            setAddressErrors((prev) => ({ ...prev, city: "" }));
                          }}
                          className={`${INPUT_CLASS} ${addressErrors.city ? "border-red-300" : ""}`}
                          placeholder="City / Town"
                        />
                        <FormError message={addressErrors.city} />
                      </div>
                      <div>
                        <label className="block font-bold text-[#234d1b]/70 mb-1.5 uppercase tracking-widest text-[10px]">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          value={newAddress.pincode}
                          onChange={(e) => {
                            setNewAddress({ ...newAddress, pincode: e.target.value });
                            setAddressErrors((prev) => ({ ...prev, pincode: "" }));
                          }}
                          className={`${INPUT_CLASS} ${addressErrors.pincode ? "border-red-300" : ""}`}
                          placeholder="6-digit pincode"
                          maxLength={6}
                        />
                        <FormError message={addressErrors.pincode} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-[#234d1b]/70 mb-1.5 uppercase tracking-widest text-[10px]">
                          State *
                        </label>
                        <div className="relative">
                          <select
                            value={newAddress.state}
                            onChange={(e) => {
                              setNewAddress({ ...newAddress, state: e.target.value });
                              setAddressErrors((prev) => ({ ...prev, state: "" }));
                            }}
                            className={`${INPUT_CLASS} appearance-none pr-10 cursor-pointer ${addressErrors.state ? "border-red-300" : ""}`}
                          >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <FormError message={addressErrors.state} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-primary-dark transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        {savingAddress ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        {editingAddressId ? "Update Address" : "Save Address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingAddressId(null);
                          setAddressErrors({});
                        }}
                        className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Security / Password Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
                  className={`${INPUT_CLASS} ${fieldErrors.password ? "border-red-300" : ""}`}
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
                  className={`${INPUT_CLASS} ${fieldErrors.confirmPassword ? "border-red-300" : ""}`}
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
      </div>
    </main>
  );
}
