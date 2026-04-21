import { Metadata } from "next";
import { Suspense } from "react";
import { cache } from "react";
import ProductClient from "./ProductClient";

import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

// React cache() deduplicates across generateMetadata + page render (Next.js preload pattern)
const getProduct = cache(async (slug: string) => {
  await connectDB();
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
  const query = isObjectId ? { _id: slug } : { slug: slug };
  return Product.findOne(query)
    .select("_id name slug images price variants stock description badge uom category seo mrp")
    .lean();
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found | Sai Nandhini Tasty World",
    };
  }

  const title = product.seo?.metaTitle || product.name || "Product Details";
  const description =
    product.seo?.metaDescription ||
    product.description?.substring(0, 160) ||
    "Authentic South Indian Delicacies";
  const keywords = product.seo?.keywords
    ? product.seo.keywords.split(",").map((k: string) => k.trim())
    : [];
  const images = product.images || [];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images,
    },
  };
}

// Async component for Suspense streaming
async function ProductContent({ slug }: { slug: string }) {
  const productDoc = await getProduct(slug);
  const product = productDoc ? JSON.parse(JSON.stringify(productDoc)) : null;
  return <ProductClient product={product} />;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-pulse space-y-4 w-full max-w-6xl mx-auto p-8">
            <div className="h-96 bg-gray-200 rounded-xl" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      }
    >
      <ProductContent slug={slug} />
    </Suspense>
  );
}
