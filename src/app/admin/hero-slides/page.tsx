"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  GripVertical,
  ImageIcon,
  Eye,
  EyeOff,
  ArrowLeft,
  Upload,
  X,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { validateForm, heroSlideSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

/* ────────────────────────────────────────────── */
/*  Types                                         */
/* ────────────────────────────────────────────── */
interface HeroSlide {
  _id?: string;
  title: string;
  titleAccent: string;
  tag: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  badge1: string;
  badge2: string;
  isActive: boolean;
  order: number;
}

const emptySlide: HeroSlide = {
  title: "",
  titleAccent: "",
  tag: "Bestseller",
  description: "",
  image: "",
  ctaText: "Shop Now",
  ctaLink: "/shop",
  badge1: "100% Natural",
  badge2: "Traditional Recipe",
  isActive: true,
  order: 1,
};

/* ────────────────────────────────────────────── */
/*  Input Styles                                  */
/* ────────────────────────────────────────────── */
const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-gray-50/80 text-gray-900 py-3 px-4 outline-none focus:border-[#f8bf51] focus:ring-2 focus:ring-[#f8bf51]/20 transition-all placeholder:text-gray-400 text-sm";

/* ────────────────────────────────────────────── */
/*  Component                                     */
/* ────────────────────────────────────────────── */
export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  /* ── Fetch Slides ── */
  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await fetch("/api/admin/hero-slides");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setSlides(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ── Handle Image Upload ── */

  /* ── Open editor for new or existing slide ── */
  const openEditor = (slide?: HeroSlide) => {
    setFieldErrors({});
    if (slide) {
      setEditingSlide({ ...slide });
    } else {
      setEditingSlide({ ...emptySlide, order: slides.length + 1 });
    }
  };

  const closeEditor = () => {
    setEditingSlide(null);
  };

  /* ── Save (Create or Update) ── */
  const handleSave = async () => {
    if (!editingSlide) return;
    const validation = validateForm(heroSlideSchema, {
      title: editingSlide?.title || "",
      image: (editingSlide?.image as any) instanceof File ? "file_uploaded" : (editingSlide?.image || ""),
    });
    if (!validation.success) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    setSaving("save");
    try {
      const isNew = !editingSlide._id;
      const url = isNew
        ? "/api/admin/hero-slides"
        : `/api/admin/hero-slides/${editingSlide._id}`;
      const method = isNew ? "POST" : "PUT";

      const formData = new FormData();
      Object.entries(editingSlide).forEach(([key, value]) => {
        if (key === "image") {
          if (value instanceof File) {
            formData.append("file", value);
          } else {
            formData.append("image", String(value));
          }
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          toast.success(isNew ? "Slide created!" : "Slide updated!");
          await fetchSlides();
          closeEditor();
        }
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to save");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(null);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Slide deleted successfully");
        setSlides(slides.filter((s) => s._id !== id));
      } else {
        toast.error("Failed to delete slide");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while deleting");
    } finally {
      setSaving(null);
    }
  };

  /* ── Toggle Active ── */
  const toggleActive = async (slide: HeroSlide) => {
    setSaving(slide._id || "");
    try {
      const formData = new FormData();
      formData.append("isActive", String(!slide.isActive));
      await fetch(`/api/admin/hero-slides/${slide._id}`, {
        method: "PUT",
        body: formData,
      });
      await fetchSlides();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#f8bf51]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ece0cc] font-['Inter',sans-serif]">
      <div className="mx-auto py-8 px-4 md:px-8">
        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] border border-gray-100 shadow-sm mb-8 sm:mb-10">
          <div className="min-w-0">
            <nav className="flex text-[10px] sm:text-xs text-gray-400 mb-2 items-center gap-1.5 font-bold uppercase tracking-widest">
              <Link
                href="/admin/settings"
                className="hover:text-[#234d1b] transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={12} /> Settings
              </Link>
              <span className="text-gray-200">/</span>
              <span className="text-[#234d1b]">Hero Carousel</span>
            </nav>
            <h1 className="text-xl sm:text-3xl font-serif font-black text-[#234d1b] leading-none">
              Carousel <span className="text-[#f8bf51] italic">Manager</span>
            </h1>
            <p className="text-gray-400 mt-2 font-medium text-[10px] sm:text-sm truncate">
              Update home page visual highlight slides.
            </p>
          </div>

          <button
            onClick={() => openEditor()}
            className="w-full sm:w-auto bg-[#f8bf51] text-white px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-lg shadow-[#f8bf51]/20 hover:bg-[#b0934e] transition-all flex items-center justify-center gap-2 active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest"
          >
            <Plus size={18} />
            <span>Add New Slide</span>
          </button>
        </header>

        {/* ── Slides Grid ── */}
        {slides.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No slides yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Add your first hero carousel slide to get started.
            </p>
            <button
              onClick={() => openEditor()}
              className="mt-6 bg-[#f8bf51] text-white px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2"
            >
              <Plus size={16} /> Create First Slide
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slides.map((slide, index) => (
              <motion.div
                key={slide._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden group transition-all hover:shadow-lg ${
                  slide.isActive
                    ? "border-gray-100"
                    : "border-red-200/60 opacity-70"
                }`}
              >
                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />

                  {/* Overlay actions */}
                  {/* Overlay actions - visible on mobile, overlay on hover for desktop */}
                  <div className="absolute inset-0 bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => openEditor(slide)}
                      className="bg-white text-gray-800 p-3 sm:p-2.5 rounded-xl hover:bg-[#f8bf51] hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      <Pencil size={18} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(slide._id!)}
                      disabled={saving === slide._id}
                      className="bg-white text-red-500 p-3 sm:p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      {saving === slide._id ? (
                        <Loader2
                          size={18}
                          className="animate-spin sm:w-4 sm:h-4"
                        />
                      ) : (
                        <Trash2 size={18} className="sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>

                  {/* Tag badge */}
                  <div className="absolute top-3 left-3 bg-[#f8bf51] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    {slide.tag}
                  </div>

                  {/* Order badge */}
                  <div className="absolute top-3 right-3 bg-white/90 text-gray-700 text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center shadow-sm">
                    {slide.order}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-[#234d1b] text-base mb-0.5 truncate">
                    {slide.title}{" "}
                    <span className="text-[#f8bf51] italic">
                      {slide.titleAccent}
                    </span>
                  </h3>
                  <p className="text-gray-400 text-xs line-clamp-2 mb-4">
                    {slide.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#234d1b]/5 text-[#234d1b] text-[9px] sm:text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-widest border border-[#234d1b]/10">
                        {slide.ctaText}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleActive(slide)}
                      className={`flex items-center gap-1.5 text-[9px] sm:text-xs font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all ${
                        slide.isActive
                          ? "bg-green-50 text-green-600 hover:bg-green-100"
                          : "bg-red-50 text-red-500 hover:bg-red-100"
                      }`}
                    >
                      {slide.isActive ? (
                        <Eye size={12} className="sm:w-3 sm:h-3" />
                      ) : (
                        <EyeOff size={12} className="sm:w-3 sm:h-3" />
                      )}
                      <span>{slide.isActive ? "Live" : "Hidden"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            Edit/Create Modal
        ═══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {editingSlide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10"
              onClick={closeEditor}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 sm:px-10 py-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-[#234d1b]">
                      {editingSlide._id ? "Edit Slide" : "New Slide"}
                    </h2>
                    <p className="text-gray-400 text-[10px] sm:text-xs font-medium mt-1 uppercase tracking-widest leading-none">
                      Slide Configuration
                    </p>
                  </div>
                  <button
                    onClick={closeEditor}
                    className="text-gray-400 hover:text-[#234d1b] p-2 bg-gray-50 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-8 py-6 space-y-5 max-h-[65vh] overflow-y-auto">
                  {/* Image Upload */}
                  <ImageUpload
                    label="Slide Image"
                    hint="800×1000px, portrait 4:5 — subject centred, clean background works best"
                    value={editingSlide.image || ""}
                    onChange={(val) =>
                      setEditingSlide({ ...editingSlide, image: val as any })
                    }
                  />
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 -mt-1">
                    <ImageIcon size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                      <span className="font-bold">Recommended size: 800 × 1000 px</span> (4:5 portrait).
                      Use a high-quality image with the subject centred and a clean background for best results.
                    </p>
                  </div>
                  {fieldErrors.image && <FormError message={fieldErrors.image} />}

                  {/* Title + Title Accent */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Title (White Text) *
                      </label>
                      <input
                        type="text"
                        value={editingSlide.title}
                        onChange={(e) =>
                          setEditingSlide({
                            ...editingSlide,
                            title: e.target.value,
                          })
                        }
                        placeholder="e.g. Authentic South Indian"
                        className={`${INPUT_CLASS} ${fieldErrors.title ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                      />
                      <FormError message={fieldErrors.title} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Accent Word (Gold Italic)
                      </label>
                      <input
                        type="text"
                        value={editingSlide.titleAccent}
                        onChange={(e) =>
                          setEditingSlide({
                            ...editingSlide,
                            titleAccent: e.target.value,
                          })
                        }
                        placeholder="e.g. Pickles"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {/* Tag */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Tag Badge
                    </label>
                    <div className="relative">
                      <select
                        value={editingSlide.tag}
                        onChange={(e) =>
                          setEditingSlide({
                            ...editingSlide,
                            tag: e.target.value,
                          })
                        }
                        className={`${INPUT_CLASS} appearance-none pr-10`}
                      >
                        <option value="Bestseller">Bestseller</option>
                        <option value="New Arrival">New Arrival</option>
                        <option value="Limited Edition">Limited Edition</option>
                        <option value="Seasonal Special">Seasonal Special</option>
                        <option value="Featured">Featured</option>
                        <option value="Premium">Premium</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingSlide.description}
                      onChange={(e) =>
                        setEditingSlide({
                          ...editingSlide,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Short description for the slide..."
                      className={INPUT_CLASS + " resize-none"}
                    />
                  </div>

                  {/* CTA Text + Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={editingSlide.ctaText}
                        onChange={(e) =>
                          setEditingSlide({
                            ...editingSlide,
                            ctaText: e.target.value,
                          })
                        }
                        placeholder="Shop Now"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        CTA Link
                      </label>
                      <input
                        type="text"
                        value={editingSlide.ctaLink}
                        onChange={(e) =>
                          setEditingSlide({
                            ...editingSlide,
                            ctaLink: e.target.value,
                          })
                        }
                        placeholder="/shop"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {/* Badge 1 + Badge 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Badge 1
                      </label>
                      <input
                        type="text"
                        value={editingSlide.badge1}
                        onChange={(e) =>
                          setEditingSlide({
                            ...editingSlide,
                            badge1: e.target.value,
                          })
                        }
                        placeholder="100% Natural"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Badge 2
                      </label>
                      <input
                        type="text"
                        value={editingSlide.badge2}
                        onChange={(e) =>
                          setEditingSlide({
                            ...editingSlide,
                            badge2: e.target.value,
                          })
                        }
                        placeholder="Traditional Recipe"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {/* Order + Active */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={editingSlide.order}
                        onChange={(e) =>
                          setEditingSlide({
                            ...editingSlide,
                            order: Number(e.target.value),
                          })
                        }
                        min={1}
                        className={INPUT_CLASS}
                      />
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        Banners display in ascending order (1 = first). Duplicate orders are auto-resequenced.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Visibility
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingSlide({
                            ...editingSlide,
                            isActive: !editingSlide.isActive,
                          })
                        }
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                          editingSlide.isActive
                            ? "bg-green-50 text-green-600 border border-green-200"
                            : "bg-red-50 text-red-500 border border-red-200"
                        }`}
                      >
                        {editingSlide.isActive ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                        {editingSlide.isActive ? "Active" : "Hidden"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={closeEditor}
                    className="px-6 py-3 rounded-xl text-gray-500 hover:text-gray-700 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving === "save"}
                    className="bg-[#f8bf51] hover:bg-[#b0934e] text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#f8bf51]/20 hover:shadow-xl transition-all"
                  >
                    {saving === "save" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {editingSlide._id ? "Update Slide" : "Create Slide"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmationModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteId && handleDelete(deleteId)}
          title="Delete Slide"
          message="Are you sure you want to delete this hero slide? This action cannot be undone."
          confirmText="Delete Now"
          type="danger"
        />
      </div>
    </div>
  );
}
