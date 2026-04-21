import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#ece0cc] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="text-7xl font-serif font-black text-[#234d1b]/10 mb-4">
          404
        </div>
        <h2 className="text-2xl font-serif font-black text-[#234d1b] mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-500 text-sm font-medium mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-[#234d1b] text-white rounded-xl font-bold text-sm hover:bg-[#1a3a14] transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
