"use client";

import { useState } from "react";
import { Search, Copy, CheckCircle2, Star, Loader2, MapPin } from "lucide-react";
import toast from "react-hot-toast";

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
}

export default function FindPlaceIdPage() {
  const [apiKey, setApiKey] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlaceResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !query.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch(
        `/api/find-place?query=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`
      );
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.status === "OK" && data.candidates?.length > 0) {
        setResult(data.candidates[0]);
      } else if (data.status === "ZERO_RESULTS") {
        setError("No business found. Try a more specific name with city.");
      } else {
        setError(data.error_message || `Google API error: ${data.status}`);
      }
    } catch {
      setError("Failed to search. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.place_id) {
      navigator.clipboard.writeText(result.place_id);
      setCopied(true);
      toast.success("Place ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[#ece0cc]/30 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-10">
          <h1 className="text-2xl md:text-3xl font-serif font-black text-[#234d1b] mb-2">
            Find Your Google Place ID
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Use your Google Maps API Key to find your business Place ID
          </p>

          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Google Maps API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full border border-gray-200 rounded-xl py-3.5 px-4 outline-none focus:border-[#234d1b] focus:ring-2 focus:ring-[#234d1b]/10 transition-all text-sm bg-gray-50 focus:bg-white"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Your Google Maps API Key (starts with AIzaSy)
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Business Name & Location
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sai Nandhini Tasty World Madurai"
                className="w-full border border-gray-200 rounded-xl py-3.5 px-4 outline-none focus:border-[#234d1b] focus:ring-2 focus:ring-[#234d1b]/10 transition-all text-sm bg-gray-50 focus:bg-white"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Enter your business name and city for better results
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#234d1b] text-white font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg hover:bg-[#1a3a14] transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2.5 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Find Place ID
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
              <p className="text-green-800 font-bold flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-600" />
                Found Your Business!
              </p>
              <p className="text-green-700 text-sm mt-1">
                Copy the Place ID below and paste it in your admin settings
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900">
                {result.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1 flex items-start gap-1.5">
                <MapPin size={14} className="shrink-0 mt-0.5" />
                {result.formatted_address}
              </p>
              {result.rating !== undefined && (
                <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                  Rating: {result.rating}
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  {result.user_ratings_total !== undefined && (
                    <span>({result.user_ratings_total} reviews)</span>
                  )}
                </p>
              )}

              <div className="mt-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Place ID (Copy This):
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={result.place_id}
                    className="flex-1 bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-sm font-mono text-gray-800 outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all shrink-0 ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-[#234d1b] text-white hover:bg-[#1a3a14]"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
