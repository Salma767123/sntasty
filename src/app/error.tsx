"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#ece0cc] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="text-2xl font-serif font-black text-[#234d1b] mb-3">
          Something went wrong
        </h2>
        <p className="text-gray-500 text-sm font-medium mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-[#234d1b] text-white rounded-xl font-bold text-sm hover:bg-[#1a3a14] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
