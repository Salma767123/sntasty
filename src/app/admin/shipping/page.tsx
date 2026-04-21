"use client";

import { useState, useEffect } from "react";
import { Truck, Plus, Trash2, Save, Loader2, Package, MapPin, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { validateForm, shippingRateSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

interface ShippingRate {
  _id?: string;
  location: string;
  rate: number;
  estimatedDelivery: string;
}

const LOCATIONS = ["Tamil Nadu", "Puducherry", "Other States"];

export default function ShippingManagementPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState<ShippingRate>({
    location: "",
    rate: 0,
    estimatedDelivery: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const res = await fetch("/api/admin/shipping-rates");
      const data = await res.json();
      
      // Check if we got an error (old schema)
      if (data.error) {
        toast.error("Old shipping data detected. Please re-configure your settings.");
        setRates([]);
      } else {
        setRates(data);
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

  const addRate = async () => {
    const validation = validateForm(shippingRateSchema, newRate);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    setSaving(true);
    try {
      const res = await fetch("/api/admin/shipping-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRate),
      });

      if (res.ok) {
        toast.success("Shipping rate added successfully");
        setNewRate({ location: "", rate: 0, estimatedDelivery: "" });
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
    if (rate.rate < 0) {
      toast.error("Rate cannot be negative");
      return;
    }
    if (!rate.estimatedDelivery.trim()) {
      toast.error("Please enter estimated delivery time");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/shipping-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rate),
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
                Configure location-based shipping charges and delivery times.
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  Location
                </label>
                <select
                  value={newRate.location}
                  onChange={(e) => {
                    setNewRate({ ...newRate, location: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, location: "" }));
                  }}
                  className={`w-full bg-gray-50 border ${fieldErrors.location ? "border-red-300" : "border-transparent"} focus:border-primary/20 rounded-xl py-3.5 px-4 outline-none transition-all shadow-sm font-black text-base focus:bg-white focus:ring-4 focus:ring-primary/5 touch-manipulation`}
                >
                  <option value="">Select location</option>
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <FormError message={fieldErrors.location} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  Shipping Charge (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRate.rate}
                  onChange={(e) => {
                    setNewRate({
                      ...newRate,
                      rate: parseFloat(e.target.value) || 0,
                    });
                    setFieldErrors((prev) => ({ ...prev, rate: "" }));
                  }}
                  placeholder="Enter 0 for free"
                  className={`w-full bg-gray-50 border ${fieldErrors.rate ? "border-red-300" : "border-transparent"} focus:border-primary/20 rounded-xl py-3.5 px-4 outline-none transition-all shadow-sm font-black text-base tabular-nums focus:bg-white focus:ring-4 focus:ring-primary/5 touch-manipulation`}
                />
                <FormError message={fieldErrors.rate} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  Estimated Delivery Time
                </label>
                <input
                  type="text"
                  value={newRate.estimatedDelivery}
                  onChange={(e) => {
                    setNewRate({
                      ...newRate,
                      estimatedDelivery: e.target.value,
                    });
                    setFieldErrors((prev) => ({ ...prev, estimatedDelivery: "" }));
                  }}
                  placeholder="e.g., 2-3 days"
                  className={`w-full bg-gray-50 border ${fieldErrors.estimatedDelivery ? "border-red-300" : "border-transparent"} focus:border-primary/20 rounded-xl py-3.5 px-4 outline-none transition-all shadow-sm font-black text-base focus:bg-white focus:ring-4 focus:ring-primary/5 touch-manipulation`}
                />
                <FormError message={fieldErrors.estimatedDelivery} />
              </div>

              <div className="flex items-end">
                <button
                  onClick={addRate}
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation text-xs uppercase tracking-widest"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Save size={18} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
              <Package size={12} />
              Tip: Enter 0 for free delivery to that location
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
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-gray-100 rounded-2xl hover:border-primary/30 transition-all gap-4"
                >
                  {editingId === rate._id ? (
                    <>
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full">
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5 leading-none">
                            Location
                          </p>
                          <p className="text-[13px] sm:text-lg font-black text-primary-dark">
                            {rate.location}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5 leading-none">
                            Shipping Charge (₹)
                          </p>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={rate.rate}
                            onChange={(e) =>
                              setRates(
                                rates.map((r) =>
                                  r._id === rate._id
                                    ? { ...r, rate: parseFloat(e.target.value) || 0 }
                                    : r
                                )
                              )
                            }
                            placeholder="Enter 0 for free"
                            className="w-full bg-gray-50 border border-gray-200 focus:border-primary/20 rounded-xl py-2 px-3 outline-none transition-all shadow-sm font-black text-base tabular-nums focus:bg-white focus:ring-2 focus:ring-primary/5"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5 leading-none">
                            Estimated Delivery
                          </p>
                          <input
                            type="text"
                            value={rate.estimatedDelivery}
                            onChange={(e) =>
                              setRates(
                                rates.map((r) =>
                                  r._id === rate._id
                                    ? { ...r, estimatedDelivery: e.target.value }
                                    : r
                                )
                              )
                            }
                            className="w-full bg-gray-50 border border-gray-200 focus:border-primary/20 rounded-xl py-2 px-3 outline-none transition-all shadow-sm font-black text-base focus:bg-white focus:ring-2 focus:ring-primary/5"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateRate(rate)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2.5 sm:p-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 focus-visible:outline-none touch-manipulation"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2.5 sm:p-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 focus-visible:outline-none touch-manipulation"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full sm:w-auto">
                        <div className="min-w-0">
                          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5 leading-none">
                            Location
                          </p>
                          <p className="text-[13px] sm:text-lg font-black text-primary-dark truncate flex items-center gap-2">
                            <MapPin size={16} className="text-primary" />
                            {rate.location}
                          </p>
                        </div>
                        <div className="hidden sm:block h-10 w-px bg-gray-50" />
                        <div className="min-w-0">
                          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5 leading-none">
                            Shipping Charge
                          </p>
                          <p className="text-lg sm:text-2xl font-serif font-black text-primary tabular-nums">
                            {rate.rate === 0 ? (
                              <span className="text-green-600 flex items-center gap-1">
                                FREE
                              </span>
                            ) : (
                              `₹${rate.rate}`
                            )}
                          </p>
                        </div>
                        <div className="hidden sm:block h-10 w-px bg-gray-50" />
                        <div className="min-w-0">
                          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5 leading-none">
                            Estimated Delivery
                          </p>
                          <p className="text-sm sm:text-base font-bold text-gray-700">
                            {rate.estimatedDelivery}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => setEditingId(rate._id!)}
                          className="text-primary hover:text-primary-dark hover:bg-primary/5 p-2.5 sm:p-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:outline-none touch-manipulation"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteRate(rate._id!)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2.5 sm:p-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 focus-visible:outline-none touch-manipulation"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </>
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
