"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Users,
  Calendar,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { validateForm, corporateEnquirySchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

export default function CorporateEnquiry() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "Corporate Booking",
    message: "",
    date: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = validateForm(corporateEnquirySchema, formData);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      setLoading(false);
      return;
    }
    setFieldErrors({});

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        toast.success("Enquiry sent successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          type: "Corporate Booking",
          message: "",
          date: "",
        });
        setFieldErrors({});
      } else {
        toast.error("Failed to send enquiry. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white border border-[#234d1b]/10 focus:border-[#f8bf51] focus:ring-2 focus:ring-[#f8bf51]/10 rounded-xl px-5 py-4 text-sm font-medium text-[#234d1b] outline-none transition-all placeholder:text-[#234d1b]/30";

  if (success) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-lg mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-100 p-10 rounded-3xl text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-emerald-800 mb-2">
              Request Received!
            </h3>
            <p className="text-emerald-600 text-sm leading-relaxed">
              Thank you for considering Sai Nandhini. Our corporate team will
              contact you within 24 hours.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-6 text-emerald-700 font-bold hover:underline text-sm"
            >
              Send another request
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-28 bg-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f8bf51]/[0.03] rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#234d1b]/[0.03] rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#f8bf51] block">
              Partner With Us
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-[#234d1b] tracking-tight">
              Bulk Orders & <br className="hidden md:block" />
              <span className="text-[#f8bf51] italic">Event Catering</span>
            </h2>
            <div className="w-16 h-1 bg-[#f8bf51] rounded-full" />
            <p className="text-[#234d1b]/50 leading-relaxed max-w-md text-sm font-medium">
              From office celebrations to grand weddings, bring the authentic
              taste of Madurai to your special occasions.
            </p>

            <div className="space-y-3 mt-6">
              {[
                {
                  icon: Briefcase,
                  title: "Corporate Gifting",
                  desc: "Custom hampers for employees & clients",
                },
                {
                  icon: Users,
                  title: "Large Gatherings",
                  desc: "Live counters & bulk sweet boxes",
                },
                {
                  icon: Calendar,
                  title: "Festival Specials",
                  desc: "Pre-booking for Diwali, Pongal & more",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex gap-4 p-5 bg-[#ece0cc]/60 rounded-2xl border border-[#234d1b]/5 hover:border-[#f8bf51]/30 hover:bg-[#ece0cc] transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-[#234d1b] rounded-xl flex items-center justify-center text-white shrink-0 group-hover:bg-[#f8bf51] group-hover:text-[#234d1b] transition-all duration-300 shadow-lg shadow-[#234d1b]/10">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#234d1b] text-base mb-0.5">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#234d1b]/40 font-medium">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#ece0cc]/40 p-8 md:p-10 rounded-3xl border border-[#234d1b]/5 shadow-xl shadow-[#234d1b]/3 relative overflow-hidden"
          >
            {/* Subtle form decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f8bf51]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2.5 mb-6 relative z-10">
              <div className="w-8 h-8 bg-[#f8bf51] rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-[#234d1b]" />
              </div>
              <h3 className="text-lg font-bold text-[#234d1b]">
                Send an Enquiry
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#234d1b]/40 mb-1.5 block uppercase tracking-wide">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setFieldErrors(prev => ({ ...prev, name: "" }));
                    }}
                    className={`${inputClass} ${fieldErrors.name ? "border-red-300" : ""}`}
                    placeholder="John Doe"
                  />
                  <FormError message={fieldErrors.name} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#234d1b]/40 mb-1.5 block uppercase tracking-wide">
                    Company
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#234d1b]/40 mb-1.5 block uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setFieldErrors(prev => ({ ...prev, email: "" }));
                  }}
                  className={`${inputClass} ${fieldErrors.email ? "border-red-300" : ""}`}
                  placeholder="john@company.com"
                />
                <FormError message={fieldErrors.email} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#234d1b]/40 mb-1.5 block uppercase tracking-wide">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      setFieldErrors(prev => ({ ...prev, phone: "" }));
                    }}
                    className={`${inputClass} ${fieldErrors.phone ? "border-red-300" : ""}`}
                    placeholder="+91 98765 43210"
                  />
                  <FormError message={fieldErrors.phone} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#234d1b]/40 mb-1.5 block uppercase tracking-wide">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        setFormData({ ...formData, type: e.target.value });
                        setFieldErrors(prev => ({ ...prev, type: "" }));
                      }}
                      className={`${inputClass} appearance-none cursor-pointer pr-10 ${fieldErrors.type ? "border-red-300" : ""}`}
                    >
                      <option>Corporate Booking</option>
                      <option>Event Catering</option>
                      <option>Bulk Order</option>
                      <option>Other</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#234d1b]/40 pointer-events-none" />
                  </div>
                  <FormError message={fieldErrors.type} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#234d1b]/40 mb-1.5 block uppercase tracking-wide">
                  Requirements
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    setFieldErrors(prev => ({ ...prev, message: "" }));
                  }}
                  className={`${inputClass} min-h-[120px] resize-none ${fieldErrors.message ? "border-red-300" : ""}`}
                  placeholder="Tell us about the event..."
                />
                <FormError message={fieldErrors.message} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#234d1b] text-white font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-[#234d1b]/15 hover:bg-[#f8bf51] hover:text-[#234d1b] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-70 group text-sm"
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    Send Enquiry{" "}
                    <Send
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
