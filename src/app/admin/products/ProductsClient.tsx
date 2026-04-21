"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import Link from "next/link";
import Pagination, { usePagination } from "@/components/Pagination";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  MoreVertical,
  Package,
  ExternalLink,
  Activity,
  AlertTriangle,
  Layers,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductModal from "@/components/admin/ProductModal";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { useSidebar } from "@/context/SidebarContext";

export default function ProductsClient({
  initialProducts,
  initialSettings,
  initialCategories,
}: {
  initialProducts: any[];
  initialSettings: any;
  initialCategories: any[];
}) {
  const { setForceCollapsed } = useSidebar();
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?admin=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Received invalid data format:", data);
        setProducts([]);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
      toast.error("Failed to load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    const url = editingProduct
      ? `/api/products/${editingProduct._id}`
      : "/api/products";
    const method = editingProduct ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        toast.success(editingProduct ? "Product updated!" : "Product created!");
        fetchProducts();
        setIsModalOpen(false);
        setEditingProduct(null);
        setForceCollapsed(false);
      } else {
        toast.error("Failed to save product");
      }
    } catch (err) {
      console.error("Failed to save product", err);
      toast.error("An error occurred while saving");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/products/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch (err) {
      console.error("Failed to delete product", err);
      toast.error("An error occurred while deleting");
    } finally {
      setDeleteId(null); // Close confirmation modal
    }
  };

  const filteredProducts = products.filter((p) => {
    // Search filter
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // KPI Calculations
  const allCategories = initialCategories?.map((c) => c.name) || Array.from(new Set(products.map((p) => p.category)));
  const totalCategories = allCategories.length;



  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedProducts,
    setCurrentPage,
    totalItems,
    itemsPerPage,
  } = usePagination(filteredProducts, 15);



  return (
    <div className="space-y-8 font-sans">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {[
          {
            label: "Total SKUs",
            value: products.length,
            icon: Package,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
          },
          {
            label: "Categories",
            value: totalCategories,
            icon: Layers,
            color: "text-amber-700",
            bg: "bg-amber-50",
          },

        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 leading-none">
                {kpi.label}
              </p>
              <h3 className="text-sm sm:text-2xl font-serif font-black text-[#234d1b] tabular-nums truncate">
                {kpi.value}
              </h3>
            </div>
            <div
              className={`p-2 sm:p-3 rounded-xl ${kpi.bg} ${kpi.color} shrink-0`}
            >
              <kpi.icon size={14} className="sm:w-5 sm:h-5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] border border-gray-100 shadow-sm transition-all">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-black text-[#234d1b] leading-none">
            Product <span className="text-[#f8bf51] italic">Vault</span>
          </h1>
          <p className="text-gray-400 mt-2 font-medium text-[10px] sm:text-sm truncate">
            Manage your high-quality product catalog and stock.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
            setForceCollapsed(true);
          }}
          className="w-full sm:w-auto bg-[#234d1b] text-white px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-[#1a3a14] transition-all flex items-center justify-center gap-2 active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest"
        >
          <Plus size={18} />
          <span>New Product</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between sticky top-0 z-30 py-3 sm:py-5 bg-[#ece0cc]/90 backdrop-blur-md">
        <div className="relative flex-grow max-w-full md:max-w-md group bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#234d1b] transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Find items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent py-3 sm:py-4 pl-12 pr-4 outline-none font-bold text-[#234d1b] placeholder:text-gray-300 touch-manipulation text-[11px] sm:text-sm"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-4 rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all touch-manipulation shadow-sm ${
              showFilters
                ? "bg-[#234d1b] text-white shadow-lg shadow-primary/20"
                : "bg-white border border-gray-100 text-gray-400 hover:text-[#234d1b]"
            }`}
          >
            <Filter size={14} /> <span>Show Filter</span>
            {selectedCategory !== "all" && (
              <span className="w-1.5 h-1.5 bg-[#f8bf51] rounded-full animate-pulse" />
            )}
          </button>

          <Link
            href="/admin/uom"
            className="hidden sm:flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-black text-gray-400 hover:text-[#234d1b] transition-all shadow-sm uppercase tracking-widest text-[10px]"
          >
            <Package size={14} /> Units
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#234d1b]">
                  Filter Products
                </h3>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                  }}
                  className="text-xs font-bold text-[#f8bf51] hover:underline uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation rounded"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation ${
                        selectedCategory === "all"
                          ? "bg-[#234d1b] text-white shadow-md"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    {allCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation ${
                          selectedCategory === cat
                            ? "bg-[#234d1b] text-white shadow-md"
                            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>


              </div>

              {/* Active Filters Summary */}
              {selectedCategory !== "all" && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    Active Filters:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory !== "all" && (
                      <span className="px-3 py-1 bg-[#ece0cc] text-[#234d1b] text-xs font-bold rounded-full flex items-center gap-2">
                        Category: {selectedCategory}
                        <button
                          onClick={() => setSelectedCategory("all")}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    )}

                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product List - Card Style Rows */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#f8bf51] border-t-transparent rounded-full animate-spin mb-6" />
            <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">
              Loading Inventory...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-100">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-bold text-[#234d1b] mb-2">
              No Products Found
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              We couldn't find any products matching your search. Try adjusting
              your filters or add a new product.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#f8bf51] font-bold hover:underline"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {paginatedProducts.map((p, i) => {

              const minPrice = p.variants?.length
                ? Math.min(...p.variants.map((v: any) => v.price))
                : p.price;

              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-white rounded-2xl sm:rounded-[20px] p-3 sm:p-4 border border-gray-100 hover:border-[#f8bf51]/30 hover:shadow-lg hover:shadow-[#f8bf51]/5 transition-all duration-300 flex flex-row items-center gap-3 sm:gap-6 relative overflow-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                >
                  {/* Decoration Line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#234d1b] opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#ece0cc] rounded-lg sm:rounded-2xl overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        className="object-cover"
                        alt={p.name}
                        width={80}
                        height={80}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#234d1b]/20">
                        <Package size={20} className="sm:w-6 sm:h-6" />
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-grow flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-lg text-[#234d1b] leading-tight truncate">
                          {p.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-[#ece0cc] text-[#234d1b]/60 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-full w-fit border border-[#234d1b]/5 shrink-0">
                          {p.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-[9px] sm:text-xs font-medium text-gray-400">
                        <span className="truncate">
                          SKU: {p._id.substring(0, 6).toUpperCase()}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0" />
                        <span className="shrink-0">
                          {p.variants?.length
                            ? `${p.variants.length} Var`
                            : "Single"}
                        </span>
                      </div>
                    </div>

                    {/* Metrics & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 lg:gap-12 shrink-0 pr-1">
                      {/* Price */}
                      <div className="text-left sm:text-right">
                        <p className="text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5 sm:mb-1">
                          Price
                        </p>
                        <p className="text-sm sm:text-lg font-serif font-black text-[#234d1b] tabular-nums">
                          ₹{minPrice}
                        </p>
                      </div>



                      {/* Actions */}
                      <div className="flex gap-1 sm:gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsModalOpen(true);
                            setForceCollapsed(true);
                          }}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-[#234d1b] hover:bg-[#ece0cc] transition-colors border border-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                        >
                          <Edit2
                            size={14}
                            className="sm:w-[18px] sm:h-[18px]"
                          />
                        </button>
                        <button
                          onClick={() => setDeleteId(p._id)}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                        >
                          <Trash2
                            size={14}
                            className="sm:w-[18px] sm:h-[18px]"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setForceCollapsed(false); }}
        onSave={handleSave}
        product={editingProduct}
        initialCategories={initialCategories}
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete()}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Confirm Delete"
        type="danger"
      />
    </div>
  );
}
