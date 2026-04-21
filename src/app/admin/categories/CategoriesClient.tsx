"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Save,
  X,
  Layers,
  Link2,
  Tag,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/admin/ImageUpload";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { validateForm, categorySchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

export default function CategoriesClient({
  initialData,
}: {
  initialData: any[];
}) {
  const [categories, setCategories] = useState<any[]>(initialData);
  const [allSubCategories, setAllSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  // ── Category form ──
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<string | File>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Sub-Category Pool (local state — names only, no parent yet) ──
  const [poolInput, setPoolInput] = useState("");
  const [pool, setPool] = useState<string[]>([]);

  // ── Mapping: pick a name from pool + pick a category → create in DB ──
  const [mapName, setMapName] = useState("");
  const [mapCategoryId, setMapCategoryId] = useState("");
  const [isMapping, setIsMapping] = useState(false);
  const [isMapCatDropdownOpen, setIsMapCatDropdownOpen] = useState(false);
  const [isMapSubDropdownOpen, setIsMapSubDropdownOpen] = useState(false);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  const [removePoolName, setRemovePoolName] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  // ── Edit category modal ──
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryImage, setEditCategoryImage] = useState<string | File>("");
  const [editCategorySlug, setEditCategorySlug] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");

  useEffect(() => {
    fetchAllSubCategories();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      setCategories(await res.json());
    } catch {
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubCategories = async () => {
    setSubLoading(true);
    try {
      const res = await fetch("/api/admin/subcategories");
      const json = await res.json();
      const subs = Array.isArray(json) ? json : [];
      setAllSubCategories(subs);
      // Sync unique names from DB into the pool
      const dbNames: string[] = [...new Set<string>(subs.map((s: any) => s.name as string))];
      setPool((prev) => {
        const merged = [...prev];
        dbNames.forEach((n) => { if (!merged.includes(n)) merged.push(n); });
        return merged;
      });
    } catch {
      setAllSubCategories([]);
    } finally {
      setSubLoading(false);
    }
  };

  // ── Category CRUD ──
  const handleAddCategory = async () => {
    const v = validateForm(categorySchema, { name: newCategory });
    if (!v.success) { setFieldErrors(v.errors); return; }
    setFieldErrors({});

    if (!newCategory || !newCategoryImage) return;

    const slug = newCategory.toLowerCase().trim().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    try {
      setIsAddingCategory(true);
      const fd = new FormData();
      fd.append("name", newCategory);
      fd.append("slug", slug);
      if (newCategoryImage instanceof File) fd.append("file", newCategoryImage);
      else fd.append("image", newCategoryImage);

      const res = await fetch("/api/admin/categories", { method: "POST", body: fd });
      if (res.ok) {
        toast.success("Category added");
        setNewCategory("");
        setNewCategoryImage("");
        fetchData();
      } else {
        toast.error("Failed to add category");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCatId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories?id=${deleteCatId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted");
        fetchData();
      } else {
        toast.error("Failed to delete category");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeleting(false);
      setDeleteCatId(null);
    }
  };

  // ── Sub-Category Pool actions ──
  const addToPool = () => {
    const name = poolInput.trim();
    if (!name) return;
    if (pool.includes(name)) { toast.error("Already in pool"); return; }
    setPool([...pool, name]);
    setPoolInput("");
  };

  const confirmRemoveFromPool = () => {
    if (!removePoolName) return;
    setPool(pool.filter((n) => n !== removePoolName));
    if (mapName === removePoolName) setMapName("");
    setRemovePoolName(null);
  };

  // ── Map to category → create in DB ──
  const handleMap = async () => {
    if (!mapName) { toast.error("Select a sub-category name from the pool"); return; }
    if (!mapCategoryId) { toast.error("Select a parent category"); return; }

    try {
      setIsMapping(true);
      const res = await fetch("/api/admin/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mapName, categoryId: mapCategoryId }),
      });
      if (res.ok) {
        toast.success(`"${mapName}" mapped successfully`);
        setMapName("");
        setMapCategoryId("");
        fetchAllSubCategories();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to map sub-category");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsMapping(false);
    }
  };

  const handleDeleteSubCategory = async () => {
    if (!deleteSubId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/subcategories?id=${deleteSubId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Sub-category removed");
        fetchAllSubCategories();
      } else {
        toast.error("Failed to delete sub-category");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeleting(false);
      setDeleteSubId(null);
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setEditCategoryName(cat.name);
    setEditCategoryImage(cat.image || "");
    setEditCategorySlug(cat.slug);
    setEditCategoryDescription(cat.description || "");
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName || !editCategoryImage) {
      toast.error("Name and image are required");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("name", editCategoryName);
      fd.append("slug", editCategorySlug);
      fd.append("description", editCategoryDescription);
      if (editCategoryImage instanceof File) fd.append("file", editCategoryImage);
      else fd.append("image", editCategoryImage);

      const res = await fetch(`/api/admin/categories?id=${editingCategory._id}`, { method: "PUT", body: fd });
      if (res.ok) {
        toast.success("Category updated");
        handleCancelEdit();
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to update");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryName("");
    setEditCategoryImage("");
    setEditCategorySlug("");
    setEditCategoryDescription("");
  };

  // Group DB sub-categories by parent
  const subsByParent = allSubCategories.reduce((acc: Record<string, any[]>, sub) => {
    const pid = sub.parentCategory?._id || sub.parentCategory || "unknown";
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(sub);
    return acc;
  }, {});

  const selectedCatName = categories.find((c) => c._id === mapCategoryId)?.name;

  return (
    <div className="space-y-8 pb-20 font-sans">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 border-b border-[#234d1b]/5 pb-4 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-[#234d1b] tracking-tight leading-tight">
            Category Management
          </h1>
          <p className="text-gray-400 mt-1 sm:mt-2 font-medium tracking-wide text-[11px] sm:text-xs md:text-sm">
            Organize your product hierarchy with flexible sub-category mapping.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#f8bf51] border-t-transparent rounded-full animate-spin mb-6" />
          <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Loading Configuration...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* ──── LEFT: Categories ──── */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#234d1b]">Categories</h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{categories.length} Total</span>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                  <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-[#234d1b] outline-none placeholder:text-gray-400 focus:bg-white focus:border-[#f8bf51]/50 focus:ring-2 focus:ring-[#f8bf51]/10 transition-all"
                  />
                </div>

                {/* Add Category */}
                <div className="space-y-4 mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New Category Name..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-grow bg-[#ece0cc] border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#f8bf51]/50 transition-shadow font-bold text-[#234d1b] placeholder:font-medium placeholder:text-gray-400 text-sm"
                    />
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCategory || !newCategoryImage || isAddingCategory}
                      className="bg-[#234d1b] text-white p-3 rounded-xl shadow-lg active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a3614] transition-colors"
                    >
                      {isAddingCategory ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                    </button>
                  </div>
                  <FormError message={fieldErrors.name} />
                  <ImageUpload value={newCategoryImage} onChange={(val) => setNewCategoryImage(val)} hint="600×600px, square format" />
                </div>

                {/* List */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {categories
                    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((cat) => (
                      <div key={cat._id} className="p-4 rounded-xl border border-gray-100 bg-white flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                            <Image src={cat.image} className="object-cover" alt="" width={40} height={40} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-black text-xs sm:text-sm truncate block text-[#234d1b]">{cat.name}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                              {(subsByParent[cat._id] || []).length} mapped items
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => handleEditCategory(cat)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-blue-500 hover:text-white transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setDeleteCatId(cat._id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-500 hover:text-white transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* ──── RIGHT: Sub-Category Workflow ──── */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Step 1: Create/Pick Names */}
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-[#f8bf51]/10 flex items-center justify-center border border-[#f8bf51]/20">
                    <Tag size={14} className="text-[#f8bf51]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#234d1b]">Step 1 — Create Sub-Category Pool</h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Define names here to reuse across any category.</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="e.g. Chocolate, Vanilla, 1kg..."
                    value={poolInput}
                    onChange={(e) => setPoolInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addToPool()}
                    className="flex-grow bg-[#ece0cc] border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#f8bf51]/50 transition-shadow font-bold text-[#234d1b] placeholder:font-medium placeholder:text-gray-400 text-sm"
                  />
                  <button
                    onClick={addToPool}
                    disabled={!poolInput.trim()}
                    className="bg-[#f8bf51] text-white p-3 rounded-xl shadow-lg active:scale-95 flex-shrink-0 disabled:opacity-40 hover:bg-[#b0934e] transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Pool chips - horizontal scroll */}
                {pool.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {pool.map((name) => (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 text-[#234d1b] border border-gray-200 shrink-0"
                      >
                        {name}
                        <span
                          onClick={() => setRemovePoolName(name)}
                          className="ml-1 rounded-full w-4 h-4 flex items-center justify-center text-[10px] bg-gray-200 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <X size={9} />
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic py-2">No names in pool yet. Add some above.</p>
                )}
              </div>

              {/* Step 2: Mapping Selection */}
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 overflow-visible">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-[#234d1b]/10 flex items-center justify-center border border-[#234d1b]/20">
                    <Link2 size={14} className="text-[#234d1b]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#234d1b]">Step 2 — Map to Category</h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Select a name + choose category → creates in database.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Step 2a: Select Parent Category FIRST */}
                  <div className="relative">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1 block">1. Select Parent Category</label>
                    <button
                      type="button"
                      onClick={() => setIsMapCatDropdownOpen(!isMapCatDropdownOpen)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-left font-bold text-sm flex justify-between items-center transition-all focus:ring-2 focus:ring-[#f8bf51]/50 outline-none hover:border-gray-200"
                    >
                      <span className={selectedCatName ? "text-[#234d1b]" : "text-gray-400 font-medium"}>
                        {selectedCatName || "Select parent category..."}
                      </span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isMapCatDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isMapCatDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-[60] w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                        >
                          {categories.map((cat) => (
                            <button
                              key={cat._id}
                              type="button"
                              onClick={() => { setMapCategoryId(cat._id); setIsMapCatDropdownOpen(false); }}
                              className={`w-full text-left px-5 py-4 text-sm font-bold flex items-center gap-4 transition-colors border-b border-gray-50 last:border-0 ${mapCategoryId === cat._id ? "bg-[#234d1b] text-white" : "text-[#234d1b] hover:bg-gray-50"}`}
                            >
                              <div className="w-7 h-7 rounded-md overflow-hidden shrink-0 border border-black/5">
                                <Image src={cat.image} alt="" width={28} height={28} className="object-cover" />
                              </div>
                              {cat.name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Step 2b: Select Sub-Category from dropdown */}
                  <div className="relative">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1 block">2. Select Sub-Category</label>
                    <button
                      type="button"
                      onClick={() => pool.length > 0 && setIsMapSubDropdownOpen(!isMapSubDropdownOpen)}
                      className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-left font-bold text-sm flex justify-between items-center transition-all focus:ring-2 focus:ring-[#f8bf51]/50 outline-none hover:border-gray-200 ${pool.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className={mapName ? "text-[#234d1b]" : "text-gray-400 font-medium"}>
                        {mapName || (pool.length === 0 ? "Create sub-categories in Step 1 first" : "Select sub-category...")}
                      </span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isMapSubDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isMapSubDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-[60] w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                        >
                          {pool.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => { setMapName(name); setIsMapSubDropdownOpen(false); }}
                              className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-colors border-b border-gray-50 last:border-0 ${mapName === name ? "bg-[#234d1b] text-white" : "text-[#234d1b] hover:bg-gray-50"}`}
                            >
                              {name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Map Action Button */}
                  <button
                    onClick={handleMap}
                    disabled={!mapName || !mapCategoryId || isMapping}
                    className="w-full bg-[#f8bf51] text-white py-4 rounded-xl hover:bg-[#b0934e] transition-all shadow-lg active:scale-95 font-black uppercase tracking-widest text-xs disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isMapping ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                    {isMapping ? "Mapping..." : `Map "${mapName || "..."}" to ${selectedCatName || "Category"}`}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>

          {/* ──── FULL WIDTH: Current Database Mappings ──── */}
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#234d1b] mb-6">Current Database Mappings</h3>
            {subLoading ? (
              <div className="flex flex-col items-center py-10 opacity-40">
                <Loader2 size={24} className="animate-spin text-[#234d1b] mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Syncing from DB...</p>
              </div>
            ) : allSubCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center opacity-40 py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                <Layers size={40} className="mb-3 text-[#234d1b]" />
                <p className="text-xs font-black uppercase tracking-widest text-[#234d1b]">No active mappings found</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 italic leading-relaxed">Follow Steps 1 & 2 above to create mappings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => {
                  const subs = subsByParent[cat._id] || [];
                  if (subs.length === 0) return null;
                  return (
                    <div key={cat._id} className="border border-gray-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3 bg-gray-50/80 p-2 rounded-lg border border-gray-100">
                        <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 border border-black/5">
                          <Image src={cat.image} alt="" width={24} height={24} className="object-cover" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#234d1b] truncate">{cat.name}</span>
                        <span className="text-[9px] font-bold bg-[#f8bf51] text-white px-2 py-0.5 rounded-full ml-auto shrink-0">{subs.length} items</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {subs.map((sub: any) => (
                          <motion.div
                            key={sub._id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-[#234d1b] group hover:border-[#f8bf51]/40 shadow-sm transition-all"
                          >
                            {sub.name}
                            <button
                              onClick={() => setDeleteSubId(sub._id)}
                              className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                              aria-label={`Remove ${sub.name}`}
                            >
                              <X size={9} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </AnimatePresence>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal isOpen={!!deleteCatId} onClose={() => setDeleteCatId(null)} onConfirm={handleDeleteCategory} title="Delete Category" message="Are you sure you want to delete this category? All its database sub-category mappings will remain but will lose their parent link." confirmText="Delete Category" type="danger" />
      <ConfirmationModal isOpen={!!deleteSubId} onClose={() => setDeleteSubId(null)} onConfirm={handleDeleteSubCategory} title="Remove Mapping" message="Delete this sub-category mapping from the database? This cannot be undone." confirmText="Delete Mapping" type="danger" />
      <ConfirmationModal isOpen={!!removePoolName} onClose={() => setRemovePoolName(null)} onConfirm={confirmRemoveFromPool} title="Remove Sub-Category" message={`Remove "${removePoolName}" from the pool? This won't delete existing database mappings.`} confirmText="Remove" type="danger" />

      {/* Edit Category Modal */}
      <EditingCategoryModal 
        isOpen={!!editingCategory}
        onClose={handleCancelEdit}
        onSave={handleUpdateCategory}
        name={editCategoryName}
        setName={setEditCategoryName}
        slug={editCategorySlug}
        setSlug={setEditCategorySlug}
        description={editCategoryDescription}
        setDescription={setEditCategoryDescription}
        image={editCategoryImage}
        setImage={setEditCategoryImage}
      />
    </div>
  );
}

// ── Shared Modal Components ──

function EditingCategoryModal({ 
  isOpen, onClose, onSave, 
  name, setName, slug, setSlug, 
  description, setDescription, 
  image, setImage 
}: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-[32px] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain shadow-2xl custom-scrollbar relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-black text-[#234d1b]">Edit Category</h2>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(e.target.value.toLowerCase().trim().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
                    }}
                    className="w-full bg-[#ece0cc] border-none rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#f8bf51]/50 font-bold text-[#234d1b]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Slug</label>
                  <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full bg-[#ece0cc] border-none rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#f8bf51]/50 font-bold text-[#234d1b]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[#ece0cc] border-none rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#f8bf51]/50 font-bold text-[#234d1b] min-h-[100px] resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Image</label>
                <ImageUpload value={image} onChange={(val) => setImage(val)} hint="600×600px square recommended" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={onClose} className="flex-1 py-4 rounded-xl bg-gray-100 text-gray-600 font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={onSave} className="flex-1 bg-[#234d1b] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#1a3614] shadow-lg transition-colors flex items-center justify-center gap-2"><Save size={16} /> Update Changes</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
