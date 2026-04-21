"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Save,
  X,
  Search,
  MoreVertical,
  Check,
  AlertCircle,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { validateForm, uomSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

export default function UOMPage() {
  const [uoms, setUoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    fetchUoms();
  }, []);

  const fetchUoms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/uom?includeInactive=true");
      const data = await res.json();
      setUoms(data);
    } catch (error) {
      console.error("Error fetching UOMs:", error);
      toast.error("Failed to load UOMs.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (uom: any = null) => {
    if (uom) {
      setEditingUom(uom);
      setFormData({ name: uom.name, code: uom.code, isActive: uom.isActive });
    } else {
      setEditingUom(null);
      setFormData({ name: "", code: "", isActive: true });
    }
    setError("");
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const validation = validateForm(uomSchema, { name: formData.name });
    if (!validation.success) {
      setFieldErrors(validation.errors);
      setSaving(false);
      return;
    }
    setFieldErrors({});

    try {
      const url = editingUom
        ? `/api/admin/uom/${editingUom._id}`
        : "/api/admin/uom";

      const method = editingUom ? "PUT" : "POST";

      // If creating new UOM, we might want to let the backend generate the code from name if code is empty
      // But if specific code is provided, use it.
      // My backend currently handles auto-generation for POST if code is missing, but checks for duplicates if provided.
      // Let's ensure code is handled properly.

      const payload = {
        ...formData,
        // Only send code if it's explicitly set or we are editing
        // Actually my POST route logic: const { name } = await req.json(); ... code: name.toLowerCase()...
        // So if I send code in POST, it might be ignored by the current backend implementation unless I update backend.
        // Let's check backend implementation again.
        // src/app/api/admin/uom/route.ts:
        // const { name } = await req.json(); ... const uom = await UOM.create({ name, code: ... })
        // It IGNORES the code sent in body! I need to fix backend if I want custom codes on creation.
        // For now, I'll assume auto-generation on create is fine, or I update the backend.
        // Let's update backend to accept code if provided.
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save UOM");
      }

      toast.success(editingUom ? "Unit updated" : "Unit created");
      setIsModalOpen(false);
      fetchUoms();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/admin/uom/${deleteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Unit deleted successfully");
        fetchUoms();
      } else {
        toast.error("Failed to delete UOM");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredUoms = uoms.filter(
    (uom) =>
      uom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uom.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="min-w-0">
          <span className="text-primary font-black uppercase tracking-[0.3em] text-[8px] sm:text-[10px] mb-2 block">
            Master Data
          </span>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-black text-primary-dark leading-none">
            Unit <span className="text-primary italic">Manager</span>
          </h1>
          <p className="text-gray-400 mt-2 font-medium text-[10px] sm:text-sm truncate">
            Define and manage measurement units.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-primary text-white px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 active:scale-95 outline-none focus:ring-4 focus:ring-primary/10 touch-manipulation text-[10px] sm:text-xs uppercase tracking-widest"
        >
          <Plus size={18} />
          <span>New Unit</span>
        </button>
      </header>

      {/* Search */}
      <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-4 max-w-sm">
        <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400 shrink-0">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Search units..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow outline-none text-xs sm:text-sm font-bold text-gray-700 placeholder:text-gray-300 transition-all touch-manipulation bg-transparent"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredUoms.map((uom) => (
              <motion.div
                key={uom._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="absolute top-4 right-4 flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleOpenModal(uom)}
                    className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all outline-none focus:ring-4 focus:ring-primary/5 touch-manipulation"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(uom._id)}
                    className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all outline-none focus:ring-4 focus:ring-red-100 touch-manipulation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mb-6 w-12 h-12 sm:w-16 sm:h-16 bg-primary/5 rounded-[1rem] sm:rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Package size={24} className="sm:w-8 sm:h-8" />
                </div>

                <h3 className="text-base sm:text-xl font-black text-primary-dark mb-1">
                  {uom.name}
                </h3>
                <div className="flex items-center gap-2 mb-6 text-gray-400">
                  <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest leading-none">
                    Code:
                  </span>
                  <span className="font-mono text-[10px] sm:text-xs font-bold bg-[#ece0cc]/30 px-2 py-0.5 rounded text-primary-dark">
                    {uom.code}
                  </span>
                </div>

                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${uom.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${uom.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                  />
                  {uom.isActive ? "Active" : "Inactive"}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredUoms.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400 font-medium">
              No units found matching your search.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 pb-0 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-primary-dark">
                    {editingUom ? "Edit Unit" : "New Unit"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Define unit details below.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation rounded"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Unit Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Kilogram, Box, Piece"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className={`w-full bg-gray-50 border ${fieldErrors.name ? "border-red-300" : "border-transparent"} focus:border-primary/20 rounded-xl px-4 py-3 outline-none transition-shadow font-medium focus-visible:ring-2 focus-visible:ring-primary/20 touch-manipulation`}
                  />
                  <FormError message={fieldErrors.name} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Unit Code
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-transparent focus:border-primary/20 rounded-xl px-4 py-3 outline-none transition-shadow font-medium font-mono text-sm focus-visible:ring-2 focus-visible:ring-primary/20 touch-manipulation"
                  // Disable code editing for new UOMs if backend dictates so, but let's allow it for edits at least.
                  // Or allow for both if backend is updated.
                  />
                  <p className="text-[10px] text-gray-400 px-1">
                    Unique identifier for this unit (e.g. kg, box, pcs).
                  </p>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, isActive: !formData.isActive })
                    }
                    className={`w-12 h-7 rounded-full transition-colors relative focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:outline-none touch-manipulation ${formData.isActive ? "bg-primary" : "bg-gray-200"}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${formData.isActive ? "left-6" : "left-1"}`}
                    />
                  </button>
                  <span className="text-sm font-medium text-gray-600">
                    Active Status
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} />
                  )}
                  {saving ? "Saving..." : "Save Unit"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Unit"
        message="Are you sure you want to delete this unit of measure?"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
