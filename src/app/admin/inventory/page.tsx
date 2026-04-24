"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Pagination, { usePagination } from "@/components/Pagination";
import {
  Search,
  Filter,
  Plus,
  Minus,
  History,
  Package,
  Save,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  AlertCircle,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { validateForm, inventoryPurchaseSchema, inventoryAdjustmentSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [threshold, setThreshold] = useState(10);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [actionType, setActionType] = useState<
    "purchase" | "adjustment" | null
  >(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // Form State
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [cost, setCost] = useState<number | "">("");
  const [supplier, setSupplier] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const fetchProducts = async () => {
    try {
      const [prodRes, settingsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/admin/settings"),
      ]);
      const productsData = await prodRes.json();
      const settingsData = await settingsRes.json();

      setProducts(productsData);
      setThreshold(settingsData.lowStockThreshold || 10);
    } catch (err) {
      console.error("Failed to fetch inventory data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setFieldErrors({});
  }, [actionType]);

  const fetchHistory = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/inventory?productId=${productId}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleManageStock = (product: any) => {
    setSelectedProduct(product);
    fetchHistory(product._id);
    setActionType(null);
    setQuantity("");
    setReason("");
    setCost("");
    setSupplier("");
  };

  const handleSubmit = async () => {
    if (actionType === "purchase") {
      const validation = validateForm(inventoryPurchaseSchema, { quantity, cost, supplier });
      if (!validation.success) { setFieldErrors(validation.errors); return; }
    } else {
      const validation = validateForm(inventoryAdjustmentSchema, { quantity, reason });
      if (!validation.success) { setFieldErrors(validation.errors); return; }
    }
    setFieldErrors({});

    setFormLoading(true);
    try {
      const payload = {
        productId: selectedProduct._id,
        variantSku: selectedVariant?.uom || null,
        type: actionType === "purchase" ? "Purchase" : "Adjustment",
        quantity: Number(quantity),
        reason: actionType === "adjustment" ? reason : undefined,
        costPerUnit: actionType === "purchase" ? Number(cost) : undefined,
        supplier: actionType === "purchase" ? supplier : undefined,
      };

      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const productRes = await fetch(`/api/products/${selectedProduct._id}`);
        const updatedProduct = await productRes.json();
        setSelectedProduct(updatedProduct);
        fetchProducts();
        fetchHistory(selectedProduct._id);
        setActionType(null);
        setQuantity("");
        setReason("");
        setCost("");
        setSupplier("");
        toast.success("Inventory updated successfully");
      } else {
        toast.error("Failed to update stock");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] border border-gray-100 shadow-sm mb-8">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-black text-[#234d1b] leading-none">
            Stock <span className="text-[#f8bf51] italic">Control</span>
          </h1>
          <p className="text-gray-400 mt-2 font-medium text-[10px] sm:text-sm truncate">
            Track movement and reconcile warehouse stock.
          </p>
        </div>
      </div>

      {/* Search Top Bar */}
      <div className="sticky top-0 z-30 py-3 sm:py-5 bg-[#ece0cc]/90 backdrop-blur-md">
        <div className="relative w-full shadow-sm rounded-xl sm:rounded-2xl group bg-white border border-gray-100">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#234d1b] transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent py-3 sm:py-4 pl-12 pr-4 outline-none font-bold text-[#234d1b] placeholder:text-gray-300 touch-manipulation text-[11px] sm:text-sm"
          />
        </div>
      </div>

      {/* Inventory List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#f8bf51] border-t-transparent rounded-full animate-spin mb-6" />
            <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">
              Syncing Inventory...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-12 text-center border-2 border-dashed border-gray-100">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#234d1b] mb-2">
              No Items Found
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
              Try adjusting your search query.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {paginatedProducts.map((p, i) => {
              const totalStock =
                p.variants?.reduce(
                  (acc: number, v: any) => acc + (v.stock || 0),
                  0,
                ) ||
                p.stock ||
                0;
              const isLowStock = totalStock <= threshold && totalStock > 0;
              const isOutOfStock = totalStock === 0;

              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleManageStock(p)}
                  className="group bg-white rounded-[1.5rem] sm:rounded-[20px] p-4 sm:p-5 border border-gray-100 hover:border-[#f8bf51]/30 hover:shadow-lg hover:shadow-[#f8bf51]/5 transition-all duration-300 cursor-pointer flex flex-col md:flex-row items-center gap-4 sm:gap-6 relative overflow-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                >
                  <div className="w-16 h-16 bg-[#ece0cc] rounded-xl sm:rounded-2xl overflow-hidden shrink-0 relative">
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        className="object-cover group-hover:scale-110 transition-transform"
                        alt={p.name}
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <Package size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0 text-center md:text-left">
                    <h3 className="font-bold text-[#234d1b] text-base sm:text-lg leading-tight group-hover:text-[#f8bf51] transition-colors truncate">
                      {p.name}
                    </h3>
                    <p className="text-[9px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mt-1">
                      {p.category} •{" "}
                      {p.variants?.length
                        ? `${p.variants.length} Var`
                        : "Single"}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-row items-center gap-4 sm:gap-8 md:gap-12 w-full md:w-auto justify-between md:justify-end shrink-0 border-t md:border-t-0 border-gray-50 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-0.5 sm:mb-1">
                        Stock
                      </p>
                      <div
                        className={`flex items-center justify-start md:justify-end gap-1.5 sm:gap-2 ${isOutOfStock ? "text-red-500" : isLowStock ? "text-orange-500" : "text-emerald-600"}`}
                      >
                        <span className="font-black text-lg sm:text-2xl font-serif tabular-nums">
                          {totalStock}
                        </span>
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-40">
                          {p.uom || "Units"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#FAF3E0] p-2.5 sm:p-3 rounded-xl text-[#f8bf51] sm:opacity-0 sm:group-hover:opacity-100 transform sm:translate-x-4 sm:group-hover:translate-x-0 transition-all active:scale-90">
                      <History size={16} className="sm:w-5 sm:h-5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Management Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-[#234d1b]/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative z-10"
            >
              {/* Modal Header */}
              <div className="px-6 sm:px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-[#ece0cc]/50">
                <div className="min-w-0 pr-4">
                  <h2 className="text-xl sm:text-3xl font-serif font-black text-[#234d1b] leading-tight truncate">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                    <Package size={12} className="text-[#f8bf51]" /> Warehouse
                    Manager
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all active:scale-95 shrink-0 shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 bg-white">
                {/* Left Col: Stock Actions */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#234d1b] mb-4">
                      Current Stock Levels
                    </h3>
                    <div className="space-y-3">
                      {selectedProduct.variants &&
                      selectedProduct.variants.length > 0 ? (
                        selectedProduct.variants.map((v: any, i: number) => (
                          <div
                            key={i}
                            className={`p-5 rounded-2xl border transition-colors cursor-pointer group focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation ${selectedVariant?.uom === v.uom ? "border-[#f8bf51] bg-[#f8bf51]/5 ring-1 ring-[#f8bf51]/20" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}
                            onClick={() => {
                              setSelectedVariant(v);
                              setActionType(null);
                            }}
                          >
                            <div className="flex justify-between items-center gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#234d1b] font-bold text-[10px] sm:text-xs shadow-sm border border-gray-100 shrink-0">
                                  {v.uom.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#234d1b] text-sm sm:text-base truncate">
                                    {v.uom}
                                  </p>
                                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                    SKU: {v.sku || "N/A"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span
                                  className={`text-lg sm:text-2xl font-serif font-black tabular-nums ${v.stock <= threshold ? "text-red-500" : "text-[#234d1b]"}`}
                                >
                                  {v.stock || 0}
                                </span>
                                <span className="text-[8px] sm:text-[10px] block font-bold text-gray-400 uppercase tracking-wider">
                                  Units
                                </span>
                              </div>
                            </div>

                            {selectedVariant?.uom === v.uom && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="pt-4 mt-4 border-t border-[#f8bf51]/10 flex gap-3"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActionType("purchase");
                                  }}
                                  className="flex-1 py-2.5 sm:py-3 bg-[#234d1b] text-white rounded-xl text-[9px] sm:text-xs font-bold uppercase tracking-widest hover:bg-[#1a3a14] transition-colors flex justify-center items-center gap-1 sm:gap-2 shadow-lg shadow-[#234d1b]/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                                >
                                  <ArrowDownRight
                                    size={12}
                                    className="sm:w-3.5 sm:h-3.5"
                                  />{" "}
                                  <span className="hidden sm:inline">
                                    Receive Stock
                                  </span>
                                  <span className="sm:hidden">Receive</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActionType("adjustment");
                                  }}
                                  className="flex-1 py-2.5 sm:py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-[9px] sm:text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors flex justify-center items-center gap-1 sm:gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                                >
                                  <History
                                    size={12}
                                    className="sm:w-3.5 sm:h-3.5"
                                  />{" "}
                                  <span className="hidden sm:inline">
                                    Adjust / Count
                                  </span>
                                  <span className="sm:hidden">Adjust</span>
                                </button>
                              </motion.div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50 text-center">
                          <p className="text-gray-400 font-bold mb-4">
                            Single SKU Product
                          </p>
                          <div className="flex gap-4 justify-center">
                            <button
                              onClick={() => {
                                setSelectedVariant(null);
                                setActionType("purchase");
                              }}
                              className="px-6 py-3 bg-[#234d1b] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-[#1a3a14] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                            >
                              Manage Stock
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Form */}
                  <AnimatePresence>
                    {actionType && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-[#FAF3E0] p-6 rounded-[24px] border border-[#f8bf51]/20 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          {actionType === "purchase" ? (
                            <ArrowDownRight
                              size={80}
                              className="text-[#234d1b]"
                            />
                          ) : (
                            <History size={80} className="text-[#f8bf51]" />
                          )}
                        </div>
                        <h4 className="font-bold text-[#234d1b] mb-6 flex items-center gap-2 relative z-10">
                          {actionType === "purchase"
                            ? "Record Incoming Stock"
                            : "Inventory Adjustment"}
                        </h4>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-[#234d1b]/60 uppercase tracking-widest mb-1.5 block">
                              Quantity Change
                            </label>
                            <input
                              type="number"
                              value={quantity}
                              onChange={(e) =>
                                setQuantity(Number(e.target.value))
                              }
                              placeholder="0"
                              className={`w-full bg-white p-3 sm:p-4 rounded-xl shadow-sm text-base sm:text-lg font-bold text-[#234d1b] outline-none transition-shadow font-serif focus-visible:ring-2 focus-visible:ring-[#f8bf51]/50 touch-manipulation tabular-nums ${fieldErrors.quantity ? "ring-2 ring-red-300" : ""}`}
                            />
                            <FormError message={fieldErrors.quantity} />
                          </div>

                          {actionType === "purchase" ? (
                            <>
                              <div>
                                <label className="text-[10px] font-bold text-[#234d1b]/60 uppercase tracking-widest mb-1.5 block">
                                  Unit Cost (₹)
                                </label>
                                <input
                                  type="number"
                                  value={cost}
                                  onChange={(e) =>
                                    setCost(Number(e.target.value))
                                  }
                                  placeholder="0.00"
                                  className={`w-full bg-white p-3 rounded-xl border-none outline-none transition-shadow font-bold focus-visible:ring-2 focus-visible:ring-[#f8bf51]/50 touch-manipulation tabular-nums ${fieldErrors.cost ? "ring-2 ring-red-300" : ""}`}
                                />
                                <FormError message={fieldErrors.cost} />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#234d1b]/60 uppercase tracking-widest mb-1.5 block">
                                  Supplier
                                </label>
                                <input
                                  type="text"
                                  value={supplier}
                                  onChange={(e) => setSupplier(e.target.value)}
                                  placeholder="Vendor Name"
                                  className={`w-full bg-white p-3 rounded-xl border-none outline-none transition-shadow font-medium focus-visible:ring-2 focus-visible:ring-[#f8bf51]/50 touch-manipulation ${fieldErrors.supplier ? "ring-2 ring-red-300" : ""}`}
                                />
                                <FormError message={fieldErrors.supplier} />
                              </div>
                            </>
                          ) : (
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-[#234d1b]/60 uppercase tracking-widest mb-1.5 block">
                                Reason Code
                              </label>
                              <div className="relative">
                                <select
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                  className={`w-full bg-white p-3 pr-10 rounded-xl outline-none font-medium cursor-pointer appearance-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#f8bf51]/50 touch-manipulation ${fieldErrors.reason ? "ring-2 ring-red-300" : ""}`}
                                >
                                  <option value="">Select Reason...</option>
                                  <option value="Damaged">
                                    Damaged / Spoilage
                                  </option>
                                  <option value="Theft">Shrinkage / Theft</option>
                                  <option value="Audit">Audit Correction</option>
                                  <option value="Return">Customer Return</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                              <FormError message={fieldErrors.reason} />
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 pt-6 relative z-10">
                          <button
                            onClick={() => setActionType(null)}
                            className="flex-1 py-3 text-gray-500 font-bold hover:bg-black/5 rounded-xl transition-colors uppercase tracking-widest text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={formLoading}
                            className="flex-[2] py-3 bg-[#234d1b] text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-[#1a3a14] transition-colors uppercase tracking-widest text-xs flex justify-center items-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {formLoading ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            Confirm Update
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Col: History */}
                <div className="bg-[#ece0cc] rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 flex flex-col h-[400px] sm:h-[600px] border border-[#234d1b]/5">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#234d1b]">
                      Transaction Log
                    </h3>
                    <div className="p-1.5 sm:p-2 bg-white rounded-lg text-[#f8bf51] shadow-sm">
                      <History size={14} className="sm:w-4 sm:h-4" />
                    </div>
                  </div>

                  <div className="overflow-y-auto space-y-4 flex-grow pr-2 custom-scrollbar">
                    {history.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <ClipboardList
                          size={40}
                          className="mb-2 text-[#234d1b]"
                        />
                        <p className="text-xs font-bold uppercase tracking-widest">
                          No transactions yet
                        </p>
                      </div>
                    ) : (
                      history.map((tx, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 group hover:border-[#f8bf51]/30 transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${tx.type === "Purchase" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}
                              >
                                {tx.type === "Purchase" ? (
                                  <ArrowDownRight
                                    size={12}
                                    className="sm:w-3.5 sm:h-3.5"
                                  />
                                ) : (
                                  <ArrowUpRight
                                    size={12}
                                    className="sm:w-3.5 sm:h-3.5"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="text-[9px] sm:text-xs font-black text-[#234d1b] uppercase tracking-wide">
                                  {tx.type}
                                </p>
                                <p className="text-[8px] font-bold text-gray-400">
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-sm sm:text-lg font-serif font-black tabular-nums ${tx.quantity > 0 ? "text-green-600" : "text-red-500"}`}
                            >
                              {tx.quantity > 0 ? "+" : ""}
                              {tx.quantity}
                            </span>
                          </div>

                          {tx.reason && (
                            <div className="mt-2 text-[10px] bg-gray-50 p-2 rounded-lg font-medium text-gray-500 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />{" "}
                              {tx.reason}
                            </div>
                          )}
                          {tx.supplier && (
                            <div className="mt-2 text-[10px] bg-gray-50 p-2 rounded-lg font-medium text-gray-500 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-[#f8bf51] rounded-full" />{" "}
                              {tx.supplier}
                            </div>
                          )}

                          <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                            <span>Prev: {tx.previousStock}</span>
                            <span>New: {tx.newStock}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
