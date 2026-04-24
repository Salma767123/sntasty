"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Users,
  Calendar,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavbarData } from "@/context/NavbarDataContext";
import { validateForm, contactSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

export default function ContactPage() {
  const { settings } = useNavbarData();
  const [activeTab, setActiveTab] = useState<"general" | "corporate">(
    "general",
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    type: "General Inquiry",
    message: "",
    date: "",
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = validateForm(contactSchema, formData);
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
        toast.success("Message sent successfully! We'll get back to you soon.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          type:
            activeTab === "general" ? "General Inquiry" : "Corporate Booking",
          message: "",
          date: "",
        });
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfos = [
    {
      title: "Visit Us",
      content:
        settings?.address ||
        "# 3/81, 1st Floor, Kaveri Main Street, SRV Nagar, Thirunagar, Madurai - 625006",
      icon: MapPin,
    },
    {
      title: "WhatsApp / Call Us",
      content: settings?.contactPhone || "+91 96009 16065",
      icon: Phone,
    },
    {
      title: "Email Us",
      content: settings?.contactEmail || "info@sainandhini.com",
      icon: Mail,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-secondary/30">
      <Navbar />

      <div className="pt-48 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block"
          >
            Get in Touch
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif font-bold text-primary-dark"
          >
            How Can We <span className="text-primary italic">Help?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 mt-6 max-w-2xl mx-auto font-medium"
          >
            Whether you have a question, feedback, or need bulk orders for your
            event, we're here to assist you.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Contact Info */}
          <div className="lg:col-span-4 space-y-8">
            {contactInfos.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm flex items-start gap-6 border border-gray-100 group hover:border-primary/20 transition-all"
              >
                <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                  <item.icon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-primary-dark mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 font-medium leading-relaxed text-sm">
                    {item.content}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Corporate Services Info */}
            <div className="bg-primary-dark p-8 rounded-[2.5rem] text-white relative overflow-hidden">
              <MessageSquare className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5" />
              <h3 className="text-xl font-serif font-bold mb-4">
                Corporate & Events
              </h3>
              <div className="space-y-3 mb-6">
                {[
                  { icon: Briefcase, text: "Corporate Gifting" },
                  { icon: Users, text: "Large Gatherings" },
                  { icon: Calendar, text: "Festival Specials" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <item.icon size={16} className="text-accent" />
                    <span className="text-white/80 font-medium">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div id="enquiry-form" className="lg:col-span-8 scroll-mt-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-xl border border-gray-100"
            >
              {/* Tab Switcher */}
              <div className="flex gap-4 mb-8 p-2 bg-gray-50 rounded-2xl">
                <button
                  onClick={() => {
                    setActiveTab("general");
                    setFormData({ ...formData, type: "General Inquiry" });
                  }}
                  className={`flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                    activeTab === "general"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  General Inquiry
                </button>
                <button
                  onClick={() => {
                    setActiveTab("corporate");
                    setFormData({ ...formData, type: "Corporate Booking" });
                  }}
                  className={`flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                    activeTab === "corporate"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Corporate / Events
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="John Doe"
                      className={`w-full bg-gray-50 border ${fieldErrors.name ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-2xl py-5 px-6 outline-none transition-all font-medium`}
                    />
                    <FormError message={fieldErrors.name} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="john@example.com"
                      className={`w-full bg-gray-50 border ${fieldErrors.email ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-2xl py-5 px-6 outline-none transition-all font-medium`}
                    />
                    <FormError message={fieldErrors.email} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      placeholder="+91 98765 43210"
                      className={`w-full bg-gray-50 border ${fieldErrors.phone ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-2xl py-5 px-6 outline-none transition-all font-medium`}
                    />
                    <FormError message={fieldErrors.phone} />
                  </div>
                  {activeTab === "corporate" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        placeholder="Your Company"
                        className="w-full bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-5 px-6 outline-none transition-all font-medium"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    {activeTab === "general" ? "Subject" : "Enquiry Type"}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-5 px-6 pr-12 outline-none transition-all font-medium appearance-none cursor-pointer"
                    >
                      {activeTab === "general" ? (
                        <>
                          <option>General Inquiry</option>
                          <option>Order Support</option>
                          <option>Product Question</option>
                          <option>Feedback</option>
                        </>
                      ) : (
                        <>
                          <option>Corporate Booking</option>
                          <option>Event Catering</option>
                          <option>Bulk Order</option>
                          <option>Corporate Gifting</option>
                        </>
                      )}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Message *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, message: "" }));
                    }}
                    placeholder={
                      activeTab === "general"
                        ? "How can we help you today?"
                        : "Tell us about your event, expected guest count, and requirements..."
                    }
                    className={`w-full bg-gray-50 border ${fieldErrors.message ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-2xl py-6 px-6 outline-none transition-all font-medium resize-none`}
                  />
                  <FormError message={fieldErrors.message} />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-primary-dark transition-all shadow-xl active:scale-95 group disabled:opacity-70"
                >
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Message{" "}
                      <Send
                        size={20}
                        className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
