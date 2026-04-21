"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/pdp/ProductGallery";
import TrustBadges from "@/components/pdp/TrustBadges";
import RelatedProducts from "@/components/pdp/RelatedProducts";
import ProductGoogleReviews from "@/components/pdp/ProductGoogleReviews";
import {
  Star,
  ShoppingCart,
  Minus,
  Plus,
  ChefHat,
  Leaf,
  Truck,
  Zap,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronDown,
  Info,
  Share2,
  Package,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useNavbarData } from "@/context/NavbarDataContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authClient } from "@/lib/auth-client";



export default function ProductClient({
  product: initialProduct,
}: {
  product: any;
}) {
  const [product] = useState<any>(initialProduct);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [price, setPrice] = useState(0);
  const { settings: navSettings } = useNavbarData();
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const { addToCart } = useCart();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        // Find first in-stock variant if managing inventory
        const firstAvailable =
          product.variants.find((v: any) => v.stock > 0) || product.variants[0];
        setSelectedVariant(firstAvailable);
        setPrice(firstAvailable.price);
      } else {
        setPrice(product.price);
      }

    }
  }, [product]);

  const handleBuyNow = () => {
    if (session?.user?.role === "admin") {
      toast.error("Admin cannot make orders");
      return;
    }
    addToCart({ ...product, price: price, uom: currentUom }, qty);
    router.push("/checkout");
  };

  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-serif font-bold text-primary-dark mb-4 tracking-tighter">
          Product Not Found
        </h1>
        <a
          href="/shop"
          className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px]"
        >
          Back to Shop
        </a>
      </div>
    );

  const currentUom = selectedVariant ? selectedVariant.uom : product.uom;
  const isOutOfStock = false;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-secondary/30 selection:bg-primary selection:text-white">
      <Navbar />

      <div className="pt-44 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-500 mb-8 uppercase tracking-wider">
          <a href="/" className="hover:text-primary transition-colors">
            Home
          </a>
          <ChevronDown size={10} className="-rotate-90" />
          <a href="/shop" className="hover:text-primary transition-colors">
            Shop
          </a>
          <ChevronDown size={10} className="-rotate-90" />
          <span className="text-primary-dark">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Product Gallery */}
          <ProductGallery images={product.images} name={product.name} />

          {/* Right: Product Info Stack */}
          <div className="flex flex-col space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-3">
                {product.badge && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-wide inline-flex items-center gap-1.5">
                    <Award size={12} />
                    {product.badge}
                  </span>
                )}
                <span className="bg-accent/10 text-accent text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-wide inline-flex items-center gap-1.5">
                  <Clock size={12} />
                  Fresh Today
                </span>
                {!isOutOfStock && (
                  <span className="bg-green-50 text-green-600 text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-wide inline-flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    In Stock
                  </span>
                )}
              </div>

              {/* Title & Share */}
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary-dark leading-tight">
                  {product.name}
                </h1>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: product.name,
                          text: `Check out ${product.name} on Sai Nandhini Tasty World!`,
                          url: window.location.href,
                        })
                        .catch(console.error);
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }
                  }}
                  className="p-3 bg-gray-100 hover:bg-primary hover:text-white rounded-xl text-gray-600 transition-all duration-300 flex-shrink-0"
                  title="Share this product"
                >
                  <Share2 size={18} />
                </button>
              </div>


            </div>

            {/* Price Section */}
            <div className="bg-gradient-to-br from-secondary to-secondary-dark rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-primary-dark">
                  ₹{price}
                </span>
                {product.badge && (
                  <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                    {product.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">Inclusive of all taxes</p>
            </div>

            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-primary-dark uppercase tracking-wide">
                  Select Size / Weight:
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedVariant(v);
                        setPrice(v.price);
                      }}
                      className={`px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide border-2 transition-all duration-200 ${selectedVariant?.uom === v.uom
                          ? "bg-primary border-primary text-white shadow-md"
                          : "bg-white border-gray-200 text-gray-700 hover:border-primary/50"
                        }`}
                    >
                      {v.uom}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-primary-dark uppercase tracking-wide">
                Quantity:
              </label>
              <div className="flex gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center gap-4 bg-white border-2 border-gray-200 px-6 py-3 rounded-xl">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="text-gray-500 hover:text-primary transition-colors"
                  >
                    <Minus size={18} strokeWidth={2.5} />
                  </button>
                  <span className="text-xl font-bold w-8 text-center text-primary-dark">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="text-gray-500 hover:text-primary transition-colors"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    if (!isOutOfStock) {
                      addToCart(
                        { ...product, price: price, uom: currentUom },
                        qty,
                      );
                    }
                  }}
                  disabled={isOutOfStock}
                  className={`flex-grow px-8 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-all duration-300 flex items-center justify-center gap-2 ${isOutOfStock
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-dark shadow-lg hover:shadow-xl"
                    }`}
                >
                  <ShoppingCart size={18} />
                  {isOutOfStock ? "Sold Out" : "Add to Cart"}
                </button>
              </div>

              {/* Buy Now Button */}
              <button
                onClick={() => !isOutOfStock && handleBuyNow()}
                disabled={isOutOfStock}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wide text-sm transition-all duration-300 flex items-center justify-center gap-2 ${isOutOfStock
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                    : "bg-accent text-white hover:bg-accent-hover shadow-md hover:shadow-lg"
                  }`}
              >
                <Zap size={18} fill={isOutOfStock ? "gray" : "white"} />
                {isOutOfStock ? "Out of Stock" : "Buy It Now"}
              </button>
            </div>

            {/* Social Proof */}

            {/* Product Features Grid */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: Leaf,
                    label: "100% Organic",
                    sublabel: "Certified ingredients",
                  },
                  {
                    icon: ChefHat,
                    label: "Handmade",
                    sublabel: "Crafted with care",
                  },
                  {
                    icon: Truck,
                    label: "Free Delivery",
                    sublabel: "On select locations",
                  },
                  {
                    icon: Award,
                    label: "Premium Quality",
                    sublabel: "Best in class",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                      <item.icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">{item.sublabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Description & Details */}
        <div className="mt-20 space-y-16">
          {/* Description Section */}
          <section className="bg-white rounded-2xl p-8 md:p-12 border border-gray-200 shadow-sm">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Info size={20} className="text-primary" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-primary-dark">
                  About This Product
                </h2>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed text-base">
                  {product.description ||
                    "Our artisanal bakes are more than just food; they're a celebration of heritage and health. Every ingredient is scrutinized to ensure it meets our strict organic standards. Handcrafted with love and baked fresh daily to bring you the authentic taste of traditional recipes."}
                </p>
              </div>

              {/* Key Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-green-50 p-2 rounded-lg flex-shrink-0">
                    <Leaf size={18} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary-dark mb-1">
                      100% Organic
                    </h4>
                    <p className="text-xs text-gray-600">
                      Sourced from certified local farmers using traditional
                      methods
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0">
                    <Clock size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary-dark mb-1">
                      Fresh Daily
                    </h4>
                    <p className="text-xs text-gray-600">
                      Baked fresh every morning, delivered the same day
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-50 p-2 rounded-lg flex-shrink-0">
                    <Package size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary-dark mb-1">
                      Eco Packaging
                    </h4>
                    <p className="text-xs text-gray-600">
                      Sustainable, biodegradable packaging materials
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-50 p-2 rounded-lg flex-shrink-0">
                    <Award size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary-dark mb-1">
                      Premium Quality
                    </h4>
                    <p className="text-xs text-gray-600">
                      No preservatives, artificial colors, or flavors
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Google Reviews Section */}
          <section
            id="reviews-section"
            className="bg-white rounded-2xl p-8 md:p-12 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-accent/10 p-2 rounded-lg">
                <Star size={20} className="text-accent" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary-dark">
                Customer Reviews
              </h2>
            </div>
            <ProductGoogleReviews productName={product.name} limit={5} />
          </section>

          {/* Trust Badges */}
          <TrustBadges />

          {/* Related Products */}
          <RelatedProducts currentId={product._id} manageInventory={false} />
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl p-4 z-[60] border-t border-gray-200 shadow-2xl">
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-xl">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={isOutOfStock}
              className="text-gray-600 disabled:opacity-50"
            >
              <Minus size={18} />
            </button>
            <span className="font-bold text-lg w-6 text-center">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              disabled={isOutOfStock}
              className="text-gray-600 disabled:opacity-50"
            >
              <Plus size={18} />
            </button>
          </div>
          <button
            onClick={() => {
              if (!isOutOfStock) {
                addToCart({ ...product, price: price, uom: currentUom }, qty);
              }
            }}
            disabled={isOutOfStock}
            className={`flex-grow font-bold uppercase tracking-wide text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 ${isOutOfStock
                ? "bg-gray-200 text-gray-400"
                : "bg-primary text-white"
              }`}
          >
            {isOutOfStock ? (
              "Out of Stock"
            ) : (
              <>
                <ShoppingCart size={16} />
                Add • ₹{price * qty}
              </>
            )}
          </button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
