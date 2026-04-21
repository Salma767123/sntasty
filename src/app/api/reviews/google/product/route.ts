import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { decryptPassword } from "@/lib/encryption";
import {
  scoreReviewsForProduct,
  getFallbackReviews,
} from "@/lib/reviewMatcher";

// Reuse the same in-memory cache as the main google reviews route
// to avoid double API calls. Cache keyed by placeId.
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getGoogleReviews(): Promise<{
  reviews: any[];
  averageRating: number;
  totalReviewCount: number;
  placeId?: string;
  error?: string;
}> {
  await connectDB();
  const settings = await Settings.findOne();

  if (!settings?.googleMyBusiness?.enabled) {
    return { reviews: [], averageRating: 0, totalReviewCount: 0, error: "Google reviews not enabled" };
  }

  const { placeId, apiKey } = settings.googleMyBusiness;

  if (!placeId || !apiKey) {
    return { reviews: [], averageRating: 0, totalReviewCount: 0, error: "Missing credentials" };
  }

  // Check cache
  const cached = cache.get(placeId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const decryptedApiKey = decryptPassword(apiKey);
  const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${decryptedApiKey}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    return { reviews: [], averageRating: 0, totalReviewCount: 0, error: "Google API request failed" };
  }

  const data = await response.json();

  if (data.status !== "OK") {
    return {
      reviews: [],
      averageRating: 0,
      totalReviewCount: 0,
      error: `API Error: ${data.status} - ${data.error_message || "Unknown"}`,
    };
  }

  const result = data.result;
  const transformedReviews = (result.reviews || []).map((review: any) => ({
    id: review.time.toString(),
    rating: review.rating,
    comment: review.text || "",
    userName: review.author_name || "Anonymous",
    userPhoto: review.profile_photo_url || "",
    createdAt: new Date(review.time * 1000).toISOString(),
    source: "google",
  }));

  const responseData = {
    reviews: transformedReviews,
    averageRating: result.rating || 0,
    totalReviewCount: result.user_ratings_total || 0,
    placeId,
  };

  cache.set(placeId, { data: responseData, timestamp: Date.now() });
  return responseData;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productName = searchParams.get("productName");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 3;

    if (!productName) {
      return NextResponse.json(
        { error: "productName query parameter is required" },
        { status: 400 },
      );
    }

    const googleData = await getGoogleReviews();

    if (googleData.error || googleData.reviews.length === 0) {
      return NextResponse.json({
        reviews: [],
        matchedReviews: [],
        totalGoogleReviews: 0,
        averageRating: googleData.averageRating,
        totalReviewCount: googleData.totalReviewCount,
        productName,
        error: googleData.error,
      });
    }

    // Score + filter reviews by product keyword relevance
    const scoredReviews = scoreReviewsForProduct(
      googleData.reviews,
      productName,
      0, // minScore = 0 means ALL reviews with at least 1 match
    );

    // If we have at least 1 strong match, return those; otherwise fall back to top-rated
    const hasStrongMatches = scoredReviews.some((r) => r.relevanceScore >= 2);

    let finalReviews;
    let isFallback = false;

    if (scoredReviews.length >= 1 && hasStrongMatches) {
      finalReviews = scoredReviews.slice(0, limit);
    } else if (scoredReviews.length >= 1) {
      // Weak matches, still show them
      finalReviews = scoredReviews.slice(0, limit);
    } else {
      // No keyword matches at all - use fall back (highest rated reviews)
      finalReviews = getFallbackReviews(googleData.reviews, limit);
      isFallback = true;
    }

    return NextResponse.json({
      reviews: finalReviews,
      matchedCount: scoredReviews.length,
      isFallback,
      productName,
      averageRating: googleData.averageRating,
      totalReviewCount: googleData.totalReviewCount,
      placeId: googleData.placeId,
    });
  } catch (error: any) {
    console.error("Error in product google reviews:", error);
    return NextResponse.json(
      {
        reviews: [],
        matchedCount: 0,
        isFallback: false,
        error: error.message || "Internal error",
      },
      { status: 500 },
    );
  }
}
