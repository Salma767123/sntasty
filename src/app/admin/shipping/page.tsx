"use client";

import { useState, useEffect } from "react";
import { Truck, Plus, Trash2, Save, Loader2, Package, MapPin, Edit2, ChevronDown, X } from "lucide-react";
import toast from "react-hot-toast";
import { validateForm, shippingRateSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

interface WeightSlab {
  upToGrams: number;
  rate: number;
}

interface ShippingRate {
  _id?: string;
  location: string;
  estimatedDelivery: string;
  weightSlabs: WeightSlab[];
  extraPerHalfKgRate: number;
  rate?: number; // legacy
}

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

const LOCATIONS = [...INDIAN_STATES, "Other States"];

const DEFAULT_SLABS: WeightSlab[] = [
  { upToGrams: 500, rate: 0 },
  { upToGrams: 1000, rate: 0 },
  { upToGrams: 1500, rate: 0 },
  { upToGrams: 2000, rate: 0 },
];

const emptyRate = (): ShippingRate => ({
  location: "",
  estimatedDelivery: "",
  weightSlabs: DEFAULT_SLABS.map((s) => ({ ...s })),
  extraPerHalfKgRate: 0,
});

// Reusable editor for the weight-slab table (Up to kg → ₹ charge).
function SlabEditor({
  slabs,
  extraPerHalfKgRate,
  onSlabsChange,
  onExtraChange,
}: {
  slabs: WeightSlab[];
  extraPerHalfKgRate: number;
  onSlabsChange: (slabs: WeightSlab[]) => void;
  onExtraChange: (val: number) => void;
}) {
  const updateSlab = (idx: number, field: keyof WeightSlab, value: number) => {
    onSlabsChange(
      slabs.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  };
  const removeSlab = (idx: number) => {
    onSlabsChange(slabs.filter((_, i) => i !== idx));
  };
  const addSlab = () => {
    const last = slabs[slabs.length - 1];
    const nextGrams = last ? last.upToGrams + 500 : 500;
    onSlabsChange([...slabs, { upToGrams: nextGrams, rate: 0 }]);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Up to (kg)</span>
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Charge (₹)</span>
        <span className="w-8" />
      </div>
      {slabs.map((slab, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <input
            type="number"
            step="0.25"
            min="0"
            value={slab.upToGrams / 1000}
            onChange={(e) =>
              updateSlab(idx, "upToGrams", Math.round((parseFloat(e.target.value) || 0) * 1000))
            }
            placeholder="0.5"
            className="w-full bg-gray-50 border border-transparent focus:border-primary/20 rounded-xl py-2.5 px-3 outline-none shadow-sm font-black text-sm tabular-nums focus:bg-white focus:ring-2 focus:ring-primary/5"
          />
          <input
            type="number"
            step="1"
            min="0"
            value={slab.rate}
            onChange={(e) => updateSlab(idx, "rate", parseFloat(e.target.value) || 0)}
            placeholder="40"
            className="w-full bg-gray-50 border border-transparent focus:border-primary/20 rounded-xl py-2.5 px-3 outline-none shadow-sm font-black text-sm tabular-nums focus:bg-white focus:ring-2 focus:ring-primary/5"
          />
          <button
            type="button"
            onClick={() => removeSlab(idx)}
            className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove slab"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addSlab}
        className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary-dark flex items-center gap-1.5 px-1 pt-1"
      >
        <Plus size={14} /> Add weight slab
      </button>

      <div className="pt-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
          Extra charge per ½kg above top slab (₹)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          value={extraPerHalfKgRate}
          onChange={(e) => onExtraChange(parseFloat(e.target.value) || 0)}
          placeholder="0 = cap at top slab rate"
          className="w-full bg-gray-50 border border-transparent focus:border-primary/20 rounded-xl py-2.5 px-3 outline-none shadow-sm font-black text-sm tabular-nums focus:bg-white focus:ring-2 focus:ring-primary/5"
        />
        <p className="text-[10px] text-gray-400 px-1 mt-1.5">
          Leave 0 to charge the top slab rate for anything heavier.
        </p>
      </div>
    </div>
  );
}

export default function ShippingManagementPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState<ShippingRate>(emptyRate());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const res = await fetch("/api/admin/shipping-rates");
      const data = await res.json();

      if (data.error) {
        toast.error("Failed to load shipping rates");
        setRates([]);
      } else {
        // Normalise legacy docs (flat rate, no slabs)
        const normalised: ShippingRate[] = (data as any[]).map((r) => ({
          ...r,
          weightSlabs:
            Array.isArray(r.weightSlabs) && r.weightSlabs.length > 0
              ? r.weightSlabs
              : typeof r.rate === "number"
                ? [{ upToGrams: 1000, rate: r.rate }]
                : [],
          extraPerHalfKgRate: r.extraPerHalfKgRate || 0,
        }));
        setRates(normalised);
      }
    } catch (error) {
      toast.error("Failed to load shipping rates");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableLocations = () => {
    const usedLocations = rates.map((r) => r.location);
    return LOCATIONS.filter((loc) => !usedLocations.includes(loc));
  };

  const sanitizeSlabs = (slabs: WeightSlab[]) =>
    slabs
      .filter((s) => s.upToGrams > 0)
      .sort((a, b) => a.upToGrams - b.upToGrams);

  const addRate = async () => {
    const payload = {
      ...newRate,
      weightSlabs: sanitizeSlabs(newRate.weightSlabs),
      rate: sanitizeSlabs(newRate.weightSlabs)[0]?.rate || 0,
    };

    const validation = validateForm(shippingRateSchema, payload);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      if (validation.errors.weightSlabs) {
        toast.error("Add at least one weight slab");
      }
      return;
    }
    setFieldErrors({});

    setSaving(true);
    try {
      const res = await fetch("/api/admin/shipping-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Shipping rate added successfully");
        setNewRate(emptyRate());
        fetchRates();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add rate");
      }
    } catch (error) {
      toast.error("Failed to add shipping rate");
    } finally {
      setSaving(false);
    }
  };

  const updateRate = async (rate: ShippingRate) => {
    if (!rate.estimatedDelivery.trim()) {
      toast.error("Please enter estimated delivery time");
      return;
    }
    const slabs = sanitizeSlabs(rate.weightSlabs);
    if (slabs.length === 0) {
      toast.error("Add at least one weight slab");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/shipping-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rate,
          weightSlabs: slabs,
          rate: slabs[0]?.rate || 0,
        }),
      });

      if (res.ok) {
        toast.success("Shipping rate updated successfully");
        setEditingId(null);
        fetchRates();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update rate");
      }
    } catch (error) {
      toast.error("Failed to update shipping rate");
    } finally {
      setSaving(false);
    }
  };

  const deleteRate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shipping rate?")) return;

    try {
      const res = await fetch(`/api/admin/shipping-rates/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Shipping rate deleted");
        fetchRates();
      } else {
        toast.error("Failed to delete rate");
      }
    } catch (error) {
      toast.error("Failed to delete shipping rate");
    }
  };

  const patchEditingRate = (id: string, patch: Partial<ShippingRate>) => {
    setRates(rates.map((r) => (r._id === id ? { ...r, ...patch } : r)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const availableLocations = getAvailableLocations();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary-dark rounded-[1rem] sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Truck className="text-white sm:w-8 sm:h-8" size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-serif font-black text-primary-dark leading-none">
                Shipping Rules
              </h1>
              <p className="text-gray-400 mt-2 font-medium text-[10px] sm:text-sm truncate">
                Weight &amp; location based shipping charges and delivery times.
              </p>
            </div>
          </div>
        </div>

        {/* Add New Rate Card */}
        {availableLocations.length > 0 && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
            <h2 className="text-lg sm:text-xl font-serif font-black text-primary-dark mb-6 flex items-center gap-2">
              <Plus size={20} className="text-primary" />
              Add New Location
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                    Location
                  </label>
                  <div className="relative">
                    <select
                      value={newRate.location}
                      onChange={(e) => {
                        setNewRate({ ...newRate, location: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, location: "" }));
                      }}
                      className={`w-full bg-gray-50 border ${fieldErrors.location ? "border-red-300" : "border-transparent"} focus:border-primary/20 rounded-xl py-3.5 px-4 pr-10 outline-none transition-all shadow-sm font-black text-base focus:bg-white focus:ring-4 focus:ring-primary/5 appearance-none touch-manipulation`}
                    >
                      <option value="">Select location</option>
                      {availableLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <FormError message={fieldErrors.location} />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                    Estimated Delivery Time
                  </label>
                  <input
                    type="text"
                    value={newRate.estimatedDelivery}
                    onChange={(e) => {
                      setNewRate({ ...newRate, estimatedDelivery: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, estimatedDelivery: "" }));
                    }}
                    placeholder="e.g., 2-3 days"
                    className={`w-full bg-gray-50 border ${fieldErrors.estimatedDelivery ? "border-red-300" : "border-transparent"} focus:border-primary/20 rounded-xl py-3.5 px-4 outline-none transition-all shadow-sm font-black text-base focus:bg-white focus:ring-4 focus:ring-primary/5 touch-manipulation`}
                  />
                  <FormError message={fieldErrors.estimatedDelivery} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  Weight Slabs
                </label>
                <SlabEditor
                  slabs={newRate.weightSlabs}
                  extraPerHalfKgRate={newRate.extraPerHalfKgRate}
                  onSlabsChange={(weightSlabs) => setNewRate({ ...newRate, weightSlabs })}
                  onExtraChange={(extraPerHalfKgRate) => setNewRate({ ...newRate, extraPerHalfKgRate })}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={addRate}
                disabled={saving}
                className="bg-primary hover:bg-primary-dark text-white py-3.5 px-8 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation text-xs uppercase tracking-widest"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Location</>}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
              <Package size={12} />
              Tip: Enter 0 charge for free delivery in a slab.
            </p>
          </div>
        )}

        {/* Existing Rates */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-serif font-black text-primary-dark mb-6 flex items-center gap-2">
            <Package size={20} className="text-primary" />
            Current Shipping Rules
          </h2>

          {rates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Truck size={48} className="mx-auto mb-4 opacity-30" />
              <p>No shipping rates configured yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rates.map((rate) => (
                <div
                  key={rate._id}
                  className="p-5 border border-gray-100 rounded-2xl hover:border-primary/30 transition-all"
                >
                  {editingId === rate._id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] sm:text-lg font-black text-primary-dark flex items-center gap-2">
                          <MapPin size={16} className="text-primary" />
                          {rate.location}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateRate(rate)}
                            disabled={saving}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2.5 rounded-xl transition-colors"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => { setEditingId(null); fetchRates(); }}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2.5 rounded-xl transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                            Estimated Delivery
                          </label>
                          <input
                            type="text"
                            value={rate.estimatedDelivery}
                            onChange={(e) => patchEditingRate(rate._id!, { estimatedDelivery: e.target.value })}
                            className="w-full bg-gray-50 border border-transparent focus:border-primary/20 rounded-xl py-3 px-4 outline-none shadow-sm font-black text-base focus:bg-white focus:ring-2 focus:ring-primary/5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                            Weight Slabs
                          </label>
                          <SlabEditor
                            slabs={rate.weightSlabs}
                            extraPerHalfKgRate={rate.extraPerHalfKgRate}
                            onSlabsChange={(weightSlabs) => patchEditingRate(rate._id!, { weightSlabs })}
                            onExtraChange={(extraPerHalfKgRate) => patchEditingRate(rate._id!, { extraPerHalfKgRate })}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] sm:text-lg font-black text-primary-dark truncate flex items-center gap-2 mb-1">
                          <MapPin size={16} className="text-primary" />
                          {rate.location}
                        </p>
                        <p className="text-xs font-bold text-gray-400 mb-3">
                          {rate.estimatedDelivery}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[...rate.weightSlabs]
                            .sort((a, b) => a.upToGrams - b.upToGrams)
                            .map((slab, i) => (
                              <span
                                key={i}
                                className="text-[11px] font-black bg-primary/5 text-primary-dark px-2.5 py-1 rounded-lg tabular-nums"
                              >
                                ≤{slab.upToGrams / 1000}kg ·{" "}
                                {slab.rate === 0 ? (
                                  <span className="text-green-600">FREE</span>
                                ) : (
                                  `₹${slab.rate}`
                                )}
                              </span>
                            ))}
                          {rate.extraPerHalfKgRate > 0 && (
                            <span className="text-[11px] font-black bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg tabular-nums">
                              +₹{rate.extraPerHalfKgRate}/½kg extra
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => setEditingId(rate._id!)}
                          className="text-primary hover:text-primary-dark hover:bg-primary/5 p-2.5 sm:p-3 rounded-xl transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteRate(rate._id!)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2.5 sm:p-3 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
