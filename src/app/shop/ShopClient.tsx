"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Filter,
  Search as SearchIcon,
  ChevronDown,
  Star,
  ShoppingCart,
  Loader2,
  Heart,
  CheckCircle2,
  X,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Zap,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSearchParams, useRouter } from "next/navigation";

export default function ShopClient({
  initialProducts,
  initialCategories,
  initialManageInventory,
}: {
  initialProducts: any[];
  initialCategories: any[];
  initialManageInventory: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "All";
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Update URL when filters change
  const updateURL = (category: string, search?: string) => {
    const params = new URLSearchParams();
    if (category && category !== "All") params.set("category", category);
    if (search) params.set("search", search);
    const query = params.toString();
    router.push(query ? `/shop?${query}` : "/shop", { scroll: false });
  };

  const [products] = useState<any[]>(initialProducts);
  const [categories] = useState<any[]>(initialCategories);
  const [loading] = useState(false);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);

  // Filters & Sorting
  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [activeSubCategory, setActiveSubCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [sortBy, setSortBy] = useState("Recommended");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const itemsPerPage = 8;

  // Handle URL parameter changes
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "All";
    const urlSearch = searchParams.get("search") || "";
    
    setActiveCategory(urlCategory);
    setSearchQuery(urlSearch);
  }, [searchParams]);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (activeCategory === "All") {
        setSubCategories([]);
        setActiveSubCategory("All");
        return;
      }

      setLoadingSubCategories(true);
      try {
        const category = categories.find((c) => c.name === activeCategory);
        if (category) {
          const res = await fetch(`/api/admin/subcategories?categoryId=${category._id}`);
          const data = await res.json();
          setSubCategories(data);
          setActiveSubCategory("All");
        }
      } catch (error) {
        console.error("Failed to fetch subcategories", error);
        setSubCategories([]);
      } finally {
        setLoadingSubCategories(false);
      }
    };

    fetchSubCategories();
  }, [activeCategory, categories]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          activeCategory === "All" || p.category === activeCategory;
        const matchesSubCategory =
          activeSubCategory === "All" || 
          (p.subCategory && (
            p.subCategory === activeSubCategory || 
            p.subCategory._id === activeSubCategory
          ));
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query ||
          p.name?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          (p.subCategory?.name || "").toLowerCase().includes(query);
        const matchesPrice =
          p.price >= priceRange[0] && p.price <= priceRange[1];
        return (
          matchesCategory &&
          matchesSubCategory &&
          matchesSearch &&
          matchesPrice
        );
      })
      .sort((a, b) => {
        if (sortBy === "Price: Low to High") return a.price - b.price;
        if (sortBy === "Price: High to Low") return b.price - a.price;
        return 0; // "Recommended"
      });
  }, [
    products,
    activeCategory,
    activeSubCategory,
    searchQuery,
    priceRange,
    sortBy,
  ]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="bg-[#FCFCFA]">
      {/* 1. Ultra-Compact Product Header (Reduced Hero Height) */}
      <section className="bg-secondary border-b border-primary/10 py-10 pt-44 md:pt-44">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-px w-8 bg-primary"></span>
                <span className="text-[10px] font-sans font-black uppercase text-primary tracking-[0.3em]">
                  Direct from our kitchen
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-black text-primary-dark">
                Authentic Flavors
              </h1>
              <p className="text-primary-dark/60 mt-2 text-xs md:text-sm font-sans font-medium">
                Showing {filteredProducts.length} Premium Treats
              </p>
            </div>

            {/* Desktop Quick Search In Header */}
            <div className="relative hidden md:block w-72">
              <SearchIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, categories..."
                className="w-full bg-white border border-primary/10 rounded-full py-3 pl-11 pr-4 text-xs font-sans font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-primary-dark placeholder:text-primary/30"
              />
            </div>

            {/* Mobile Search */}
            <div className="relative md:hidden w-full mt-2">
              <SearchIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"
                size={14}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, categories..."
                className="w-full bg-white border border-primary/10 rounded-full py-2.5 pl-10 pr-4 text-xs font-sans font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-primary-dark placeholder:text-primary/30 shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
          {/* 2. Modern Sidebar Filters (Amazon/Flipkart Style) */}
          {/* 2. Modern Sidebar Filters (Hidden on Mobile) */}
          <aside className="hidden lg:block lg:w-72 shrink-0 space-y-8 bg-white/50 p-6 rounded-[2rem] border border-primary/5 h-fit sticky top-24">
            {/* Active Filters Summary */}
            {(activeCategory !== "All" || activeSubCategory !== "All") && (
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-sans font-black uppercase tracking-widest text-primary-dark">
                    Active Filters
                  </h4>
                  <button
                    onClick={() => {
                      updateURL("All", searchQuery);
                      setActiveSubCategory("All");
                    }}
                    className="text-[9px] font-sans font-bold text-primary hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeCategory !== "All" && (
                    <span className="px-2 py-1 bg-white text-[9px] font-sans font-bold rounded-lg border border-primary/20 text-primary flex items-center gap-1">
                      {activeCategory}{" "}
                      <X
                        size={10}
                        className="cursor-pointer"
                        onClick={() => {
                          updateURL("All", searchQuery);
                          setActiveSubCategory("All");
                        }}
                      />
                    </span>
                  )}
                  {activeSubCategory !== "All" && (
                    <span className="px-2 py-1 bg-white text-[9px] font-sans font-bold rounded-lg border border-primary/20 text-primary flex items-center gap-1">
                      {subCategories.find(s => s._id === activeSubCategory || s.name === activeSubCategory)?.name || activeSubCategory}{" "}
                      <X
                        size={10}
                        className="cursor-pointer"
                        onClick={() => setActiveSubCategory("All")}
                      />
                    </span>
                  )}

                </div>
              </div>
            )}

            {/* Categories Vertical */}
            <div>
              <h3 className="text-[11px] font-sans font-black text-primary-dark uppercase tracking-widest mb-4 flex items-center justify-between">
                Categories <ChevronDown size={14} className="text-primary/30" />
              </h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    updateURL("All", searchQuery);
                    setActiveSubCategory("All");
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-sans font-bold transition-all ${activeCategory === "All" ? "bg-primary-dark text-white" : "text-primary/60 hover:bg-white hover:text-primary-dark"}`}
                >
                  All Collection
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => {
                      updateURL(cat.name, searchQuery);
                      setActiveSubCategory("All");
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-sans font-bold transition-all ${activeCategory === cat.name ? "bg-primary-dark text-white" : "text-primary/60 hover:bg-white hover:text-primary-dark"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SubCategories */}
            {activeCategory !== "All" && (
              <div>
                <h3 className="text-[11px] font-sans font-black text-primary-dark uppercase tracking-widest mb-4 flex items-center justify-between">
                  Sub Categories <ChevronDown size={14} className="text-primary/30" />
                </h3>
                {loadingSubCategories ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-primary/40" />
                  </div>
                ) : subCategories.length > 0 ? (
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setActiveSubCategory("All")}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-sans font-bold transition-all ${activeSubCategory === "All" ? "bg-primary text-white" : "text-primary/60 hover:bg-white hover:text-primary-dark"}`}
                    >
                      All {activeCategory}
                    </button>
                    {subCategories.map((sub) => (
                      <button
                        key={sub._id}
                        onClick={() => setActiveSubCategory(sub._id)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-sans font-bold transition-all ${activeSubCategory === sub._id ? "bg-primary text-white" : "text-primary/60 hover:bg-white hover:text-primary-dark"}`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-primary/40 italic px-4">No subcategories</p>
                )}
              </div>
            )}

            {/* Price Range Filter */}
            <div>
              <h3 className="text-[11px] font-sans font-black text-primary-dark uppercase tracking-widest mb-4">
                Price Range
              </h3>
              <div className="space-y-4">
                {/* Price Input Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      Min
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={priceRange[1]}
                        value={priceRange[0]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setPriceRange([Math.min(val, priceRange[1]), priceRange[1]]);
                        }}
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-primary-dark focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      Max
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={priceRange[0]}
                        max="10000"
                        value={priceRange[1]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 2000;
                          setPriceRange([priceRange[0], Math.max(val, priceRange[0])]);
                        }}
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-primary-dark focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                        placeholder="2000"
                      />
                    </div>
                  </div>
                </div>

                {/* Price Range Slider */}
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-primary h-1.5 bg-secondary border border-primary/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-sans font-bold text-gray-400">
                      ₹{priceRange[0]}
                    </span>
                    <span className="text-[10px] font-sans font-black text-primary-dark">
                      ₹{priceRange[1]}
                    </span>
                  </div>
                </div>
              </div>
            </div>




          </aside>

          {/* 3. High-Density Product Grid (Bringing Items Above Fold) */}
          {/* 3. High-Density Product Grid (Bringing Items Above Fold) */}
          <div className="flex-grow">
            {/* Utility Bar */}
            <div className="flex items-center justify-between mb-6 md:mb-8 bg-white/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-primary/5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex lg:hidden items-center gap-2 text-[10px] font-sans font-black text-primary-dark uppercase tracking-widest bg-primary/5 px-3 py-2 rounded-lg"
                >
                  <Filter size={14} /> Filters
                </button>
                <div className="hidden lg:flex items-center gap-2 text-[10px] font-sans font-black text-primary-dark uppercase tracking-widest">
                  <Filter size={14} /> Filters
                </div>
                <span className="h-4 w-px bg-primary/10"></span>
                <p className="text-[10px] font-sans font-bold text-primary/40 uppercase tracking-widest">
                  {filteredProducts.length} Results
                </p>
              </div>

              <div className="flex items-center gap-2 group relative">
                <ArrowUpDown
                  size={14}
                  className="text-primary/30 absolute left-0 pointer-events-none"
                />
                <select
                  className="appearance-none bg-transparent pl-5 pr-4 py-1 text-[10px] font-sans font-black text-primary-dark uppercase tracking-widest cursor-pointer outline-none focus:ring-0 border-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Recommended">Recommended</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-[2rem] p-4 space-y-4 border border-primary/5"
                  >
                    <div className="aspect-[4/5] bg-secondary/20 rounded-2xl animate-pulse" />
                    <div className="h-4 bg-secondary/20 rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-secondary/20 rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-primary/10">
                <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary/30">
                  <LayoutGrid size={32} />
                </div>
                <h3 className="text-lg font-serif font-black text-primary-dark mb-2">
                  No Matching Flavors
                </h3>
                <p className="text-primary/60 text-sm max-w-xs mx-auto font-sans">
                  We couldn't find any products matching your current filters.
                  Try adjusting them!
                </p>
                <button
                  onClick={() => {
                    updateURL("All");
                    setActiveSubCategory("All");
                    setPriceRange([0, 2000]);
                  }}
                  className="mt-6 px-8 py-3 bg-primary-dark text-white rounded-full text-[10px] font-sans font-black uppercase tracking-widest shadow-xl hover:bg-primary transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  <AnimatePresence mode="popLayout">
                    {paginatedProducts.map((p, idx) => {
                      return (
                        <motion.div
                          layout
                          key={p._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group relative"
                        >
                          <div
                            className={`h-full bg-white rounded-[2rem] p-2.5 md:p-4 border border-primary/5 hover:border-accent/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col`}
                          >
                            {/* Product Image Wrapper */}
                            <Link href={`/shop/${p.slug || p._id}`} className="block">
                              <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-secondary/10 mb-4">
                                <Image
                                  src={
                                    p.images?.[0] ||
                                    "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=800"
                                  }
                                  alt={p.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                  fill
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                  priority={idx < 4}
                                />

                                {/* Badges */}
                                {p.badge && (
                                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary-dark px-2.5 py-1 rounded-lg text-[9px] font-sans font-black uppercase tracking-widest shadow-sm">
                                    {p.badge}
                                  </div>
                                )}

                                {/* Wishlist Button */}
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (isInWishlist(p._id)) {
                                      removeFromWishlist(p._id);
                                    } else {
                                      addToWishlist(p);
                                    }
                                  }}
                                  className={`absolute top-4 right-4 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 ${
                                    isInWishlist(p._id)
                                      ? 'bg-red-500 text-white hover:bg-red-600'
                                      : 'bg-white/90 text-primary-dark hover:bg-red-500 hover:text-white'
                                  }`}
                                >
                                  <Heart size={14} fill={isInWishlist(p._id) ? 'currentColor' : 'none'} />
                                </button>


                              </div>
                            </Link>

                            {/* Product Details */}
                            <div className="flex-grow flex flex-col px-1 pb-1">
                              <Link href={`/shop/${p.slug || p._id}`} className="block">
                                <div className="flex justify-between items-start mb-2">
                                  <p className="text-[10px] font-sans font-black text-primary/60 uppercase tracking-widest truncate">
                                    {p.category}
                                  </p>
                                </div>
                                <h3 className="text-sm font-serif font-black text-primary-dark line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-primary transition-colors mb-4">
                                  {p.name}
                                </h3>

                                <div className="flex items-baseline gap-2 mb-4">
                                  <p className="text-xl font-sans font-black text-brown">
                                    ₹{p.price}
                                  </p>
                                  {p.mrp && p.mrp > p.price && (
                                    <span className="text-xs font-sans text-primary/30 line-through">
                                      ₹{p.mrp}
                                    </span>
                                  )}
                                </div>
                              </Link>

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (p.variants && p.variants.length > 0) {
                                    const bestVariant = p.variants[0];
                                    addToCart(
                                      {
                                        ...p,
                                        price: bestVariant.price,
                                        uom: bestVariant.uom,
                                      },
                                      1,
                                    );
                                  } else {
                                    addToCart(p, 1);
                                  }
                                }}
                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 bg-primary text-white hover:bg-primary-dark`}
                              >
                                <ShoppingCart size={14} />
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Modern Pagination */}
                {totalPages > 1 && (
                  <div className="mt-16 flex items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="p-3 rounded-2xl bg-white border border-primary/10 text-primary/40 hover:text-primary hover:border-primary/30 disabled:opacity-30 transition-all shadow-sm"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-12 h-12 rounded-2xl font-sans font-black text-xs transition-all ${currentPage === i + 1 ? "bg-primary-dark text-white shadow-xl scale-110" : "bg-white text-primary/40 border border-primary/10 hover:border-primary/30"}`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-3 rounded-2xl bg-white border border-primary/10 text-primary/40 hover:text-primary hover:border-primary/30 disabled:opacity-30 transition-all shadow-sm"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Benefits HUD (Amazon/Flipkart Style) */}
      <section className="bg-white border-y border-primary/5 py-12 mb-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            {
              icon: <CheckCircle2 className="text-primary-dark" />,
              title: "Quality Check",
              desc: "100% Homemade",
            },
            {
              icon: <Zap className="text-accent" />,
              title: "Fast Shipping",
              desc: "Ships in 24 Hours",
            },
            {
              icon: <Heart className="text-secondary" />,
              title: "Family Recipe",
              desc: "Heritage Taste",
            },
            {
              icon: <Package className="text-brown" />,
              title: "Secure Packing",
              desc: "Fragile Protected",
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mb-3 shadow-inner text-primary-dark">
                {item.icon}
              </div>
              <h4 className="text-[11px] font-sans font-black uppercase text-primary-dark mb-1">
                {item.title}
              </h4>
              <p className="text-[10px] text-primary/40 font-sans font-bold uppercase tracking-tighter">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white z-[101] shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-serif font-black text-primary-dark uppercase tracking-wider">
                    Filters
                  </h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-primary-dark"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-10 pb-20">
                  {/* Reuse Sidebar logic inside Drawer */}
                  <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-sans font-black uppercase tracking-widest text-primary-dark">
                        Active Filters
                      </h4>
                      <button
                        onClick={() => {
                          updateURL("All", searchQuery);
                          setActiveSubCategory("All");
                        }}
                        className="text-[9px] font-sans font-bold text-primary hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeCategory === "All" && activeSubCategory === "All" && (
                        <span className="text-[10px] text-gray-400 font-bold uppercase italic">
                          None Active
                        </span>
                      )}
                      {activeCategory !== "All" && (
                        <span className="px-3 py-1.5 bg-white text-[10px] font-sans font-bold rounded-lg border border-primary/20 text-primary flex items-center gap-2">
                          {activeCategory}{" "}
                          <X
                            size={12}
                            className="cursor-pointer"
                            onClick={() => {
                              updateURL("All", searchQuery);
                              setActiveSubCategory("All");
                            }}
                          />
                        </span>
                      )}
                      {activeSubCategory !== "All" && (
                        <span className="px-3 py-1.5 bg-white text-[10px] font-sans font-bold rounded-lg border border-primary/20 text-primary flex items-center gap-2">
                          {subCategories.find(s => s._id === activeSubCategory)?.name || activeSubCategory}{" "}
                          <X
                            size={12}
                            className="cursor-pointer"
                            onClick={() => setActiveSubCategory("All")}
                          />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="text-[12px] font-sans font-black text-primary-dark uppercase tracking-widest mb-4">
                      Categories
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          updateURL("All", searchQuery);
                          setActiveSubCategory("All");
                        }}
                        className={`text-left px-4 py-3 rounded-xl text-xs font-sans font-bold transition-all ${activeCategory === "All" ? "bg-primary-dark text-white shadow-lg" : "bg-gray-50 text-primary/60"}`}
                      >
                        All
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => {
                            updateURL(cat.name, searchQuery);
                            setActiveSubCategory("All");
                          }}
                          className={`text-left px-4 py-3 rounded-xl text-xs font-sans font-bold transition-all ${activeCategory === cat.name ? "bg-primary-dark text-white shadow-lg" : "bg-gray-50 text-primary/60"}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SubCategories */}
                  {activeCategory !== "All" && (
                    <div>
                      <h3 className="text-[12px] font-sans font-black text-primary-dark uppercase tracking-widest mb-4">
                        Sub Categories
                      </h3>
                      {loadingSubCategories ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 size={16} className="animate-spin text-primary/40" />
                        </div>
                      ) : subCategories.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setActiveSubCategory("All")}
                            className={`text-left px-4 py-3 rounded-xl text-xs font-sans font-bold transition-all ${activeSubCategory === "All" ? "bg-primary text-white shadow-lg" : "bg-gray-50 text-primary/60"}`}
                          >
                            All
                          </button>
                          {subCategories.map((sub) => (
                            <button
                              key={sub._id}
                              onClick={() => setActiveSubCategory(sub._id)}
                              className={`text-left px-4 py-3 rounded-xl text-xs font-sans font-bold transition-all ${activeSubCategory === sub._id ? "bg-primary text-white shadow-lg" : "bg-gray-50 text-primary/60"}`}
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-primary/40 italic">No subcategories available</p>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div>
                    <h3 className="text-[12px] font-sans font-black text-primary-dark uppercase tracking-widest mb-4">
                      Price Range
                    </h3>
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([0, parseInt(e.target.value)])
                      }
                      className="w-full accent-primary h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-3 px-1">
                      <span className="text-[10px] font-sans font-bold text-gray-400">
                        ₹0
                      </span>
                      <span className="text-[12px] font-sans font-black text-primary-dark">
                        Up to ₹{priceRange[1]}
                      </span>
                    </div>
                  </div>





                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
