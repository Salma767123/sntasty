import { Metadata } from "next";
import { cache } from "react";
import connectDB from "@/lib/mongodb";
import Page from "@/models/Page";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import { Calendar, FileText, Shield, Lock, RotateCcw, Truck, ScrollText } from "lucide-react";

// Force dynamic rendering to avoid build-time database timeouts
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// React cache() deduplicates across generateMetadata + page render
const getPageData = cache(async (slug: string) => {
  await connectDB();
  const page = await Page.findOne({ slug }).lean();
  return page ? JSON.parse(JSON.stringify(page)) : null;
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageData(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: `${page.title} | Sai Nandhini`,
    description: page.content.substring(0, 160).replace(/<[^>]*>/g, ""),
  };
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageData(slug);

  if (!page) {
    notFound();
  }

  const iconMap: Record<string, any> = {
    privacy: Lock,
    terms: ScrollText,
    returns: RotateCcw,
    shipping: Truck,
  };
  const PageIcon = iconMap[slug] || FileText;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-44 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-6">
            <PageIcon className="text-primary" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary-dark mb-4">
            {page.title}
          </h1>
          {page.lastUpdated && (
            <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
              <Calendar size={16} />
              <span>
                Last updated:{" "}
                {new Date(page.lastUpdated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">


            {/* Content Body */}
            <div className="p-8 md:p-12">
              <div
                className="prose prose-lg max-w-none
                  prose-headings:text-primary-dark prose-headings:font-bold
                  prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:pb-3 prose-h1:border-b prose-h1:border-gray-200
                  prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:flex prose-h2:items-center prose-h2:gap-2
                  prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:text-primary
                  prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-4 prose-h4:font-semibold
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base
                  prose-ul:my-4 prose-ul:space-y-2
                  prose-ol:my-4 prose-ol:space-y-2
                  prose-li:text-gray-700 prose-li:leading-relaxed
                  prose-li:marker:text-primary
                  prose-strong:text-primary-dark prose-strong:font-semibold
                  prose-a:text-accent prose-a:no-underline prose-a:font-medium hover:prose-a:underline hover:prose-a:text-accent/80
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                  prose-code:text-primary prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-lg
                  prose-table:border-collapse prose-table:w-full
                  prose-th:bg-primary/10 prose-th:text-primary-dark prose-th:font-bold prose-th:p-3 prose-th:text-left
                  prose-td:border prose-td:border-gray-200 prose-td:p-3
                  prose-hr:border-gray-200 prose-hr:my-8"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              If you have any questions about this policy, please{" "}
              <a
                href="/contact"
                className="text-accent font-semibold hover:underline"
              >
                contact us
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
