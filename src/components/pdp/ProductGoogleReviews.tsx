"use client";

import React, { useEffect, useState } from "react";
import { Star, Quote, ExternalLink, Loader2 } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ScoredReview {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  userPhoto?: string;
  createdAt: string;
  source: string;
  relevanceScore: number;
  matchedKeywords: string[];
}

interface ProductGoogleReviewsData {
  reviews: ScoredReview[];
  matchedCount: number;
  isFallback: boolean;
  productName: string;
  averageRating: number;
  totalReviewCount: number;
  placeId?: string;
  error?: string;
}

interface Props {
  productName: string;
  limit?: number;
}

// Google G Logo SVG inline
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          className={
            star <= rating
              ? "text-amber-400 fill-amber-400"
              : "text-gray-300 fill-gray-100"
          }
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  index,
}: {
  review: ScoredReview;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.comment.length > 160;
  const displayComment =
    isLong && !expanded ? review.comment.slice(0, 160) + "…" : review.comment;

  const timeAgo = (() => {
    const diff = Date.now() - new Date(review.createdAt).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
      className="group relative bg-gradient-to-br from-white to-amber-50/30 border border-amber-100 rounded-2xl p-5 hover:border-amber-200 hover:shadow-md transition-all duration-300"
    >
      {/* Google badge */}
      <div className="absolute top-4 right-4 opacity-60 group-hover:opacity-100 transition-opacity">
        <GoogleIcon className="w-4 h-4" />
      </div>

      {/* Quote icon */}
      <Quote size={20} className="text-amber-300 mb-3" />

      {/* Stars */}
      <StarRating rating={review.rating} />

      {/* Comment */}
      <p className="text-sm text-gray-700 leading-relaxed mt-3 mb-4">
        {displayComment}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 text-primary font-semibold text-xs hover:underline"
          >
            {expanded ? "less" : "more"}
          </button>
        )}
      </p>

      {/* User info */}
      <div className="flex items-center justify-between pt-3 border-t border-amber-100">
        <div className="flex items-center gap-2.5">
          {review.userPhoto ? (
            <Image
              src={review.userPhoto}
              alt={review.userName}
              width={32}
              height={32}
              className="rounded-full ring-1 ring-amber-200"
              unoptimized
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <span className="text-primary font-bold text-xs">
                {review.userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-800 leading-tight">
              {review.userName}
            </p>
            <p className="text-[10px] text-gray-400">{timeAgo}</p>
          </div>
        </div>

        <a
          href="https://www.google.com/search?q=sai+nandhini+tasty+world+madurai+reviews"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-primary/60 hover:text-primary flex items-center gap-0.5 transition-colors"
          title="View on Google"
        >
          <ExternalLink size={10} />
        </a>
      </div>
    </motion.div>
  );
}

export default function ProductGoogleReviews({ productName, limit = 3 }: Props) {
  const [data, setData] = useState<ProductGoogleReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productName) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/reviews/google/product?productName=${encodeURIComponent(productName)}&limit=${limit}`,
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch product Google reviews:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productName, limit]);

  // Don't render anything if loading fails or no reviews
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-xs">Loading Google reviews…</span>
      </div>
    );
  }

  if (!data || data.error || !data.reviews || data.reviews.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mt-8 pt-8 border-t border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GoogleIcon className="w-5 h-5" />
            <h3 className="font-bold text-sm text-gray-800">
              Google Reviews
              {!data.isFallback ? (
                <span className="ml-1.5 text-[10px] font-semibold text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full">
                  Relevant to this product
                </span>
              ) : (
                <span className="ml-1.5 text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  Top rated
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="font-bold text-gray-700">
              {data.averageRating.toFixed(1)}
            </span>
            <span className="text-gray-400">
              ({data.totalReviewCount.toLocaleString()} total)
            </span>
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {data.placeId && (
            <a
              href={`https://search.google.com/local/writereview?placeid=${data.placeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-md hover:shadow-lg"
            >
              <Star size={16} className="fill-white" />
              Write a Google Review
            </a>
          )}

          <a
            href="https://www.google.com/search?q=sai+nandhini+tasty+world+madurai+reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
          >
            <GoogleIcon className="w-3.5 h-3.5" />
            View all {data.totalReviewCount.toLocaleString()} reviews on Google
            <ExternalLink size={10} />
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
