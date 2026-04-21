import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import TrustSection from "@/components/TrustSection";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import WhyChooseUs from "@/components/WhyChooseUs";
import AboutUs from "@/components/AboutUs";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import CorporateEnquiry from "@/components/CorporateEnquiry";
import GoogleReviewsCarousel from "@/components/GoogleReviewsCarousel";
import { getHeroSlides, getCategories, getFeaturedProducts } from "@/lib/data";
import { getSettingsData } from "@/lib/admin-data";

// Force dynamic rendering — prevents MongoDB calls at build/prerender time
export const dynamic = "force-dynamic";


// Async server components for Suspense streaming (Next.js data-patterns guideline)
async function HeroSection() {
  const heroSlides = await getHeroSlides();
  return <HeroCarousel initialSlides={heroSlides} />;
}

async function CategoriesSection() {
  const categories = await getCategories();
  return <CategorySection initialCategories={categories} />;
}

async function ProductsSection() {
  const products = await getFeaturedProducts(8);
  return <FeaturedProducts initialProducts={products} />;
}

async function StorySection() {
  const settings = await getSettingsData();
  return <AboutUs ourStory={settings?.ourStory} />;
}

async function WhyChooseSection() {
  const settings = await getSettingsData();
  return <WhyChooseUs configuration={settings?.whyChooseUs} />;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#ece0cc]">
      <Navbar />

      {/* Hero — streams first, shows skeleton while loading */}
      <Suspense fallback={<div className="h-[60vh] bg-[#ece0cc] animate-pulse" />}>
        <HeroSection />
      </Suspense>

      {/* Trust Badges — static, renders instantly */}
      <TrustSection />

      {/* Categories — streams independently */}
      <Suspense fallback={<div className="h-64 bg-[#ece0cc] animate-pulse" />}>
        <CategoriesSection />
      </Suspense>

      {/* Featured Products — streams independently */}
      <Suspense fallback={<div className="h-96 bg-white animate-pulse" />}>
        <ProductsSection />
      </Suspense>

      {/* Static sections — render instantly */}
      <Suspense fallback={<div className="h-[60vh] bg-[#234d1b] animate-pulse" />}>
        <WhyChooseSection />
      </Suspense>
      <Suspense fallback={<div className="h-[60vh] bg-[#ece0cc] animate-pulse" />}>
        <StorySection />
      </Suspense>
      <GoogleReviewsCarousel />
      <CorporateEnquiry />
      <CTASection />

      <Footer />
    </main>
  );
}
