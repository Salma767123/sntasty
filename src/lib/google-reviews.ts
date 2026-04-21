/**
 * Google My Business Reviews Helper Functions
 * 
 * This file contains utility functions for working with Google My Business API
 */

export interface GoogleReview {
  reviewId: string;
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime?: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GoogleReviewsResponse {
  reviews: GoogleReview[];
  averageRating: number;
  totalReviewCount: number;
  nextPageToken?: string;
}

/**
 * Convert Google star rating enum to number
 */
export function starRatingToNumber(rating: GoogleReview["starRating"]): number {
  const ratingMap = {
    FIVE: 5,
    FOUR: 4,
    THREE: 3,
    TWO: 2,
    ONE: 1,
  };
  return ratingMap[rating] || 0;
}

/**
 * Transform Google review to our internal format
 */
export function transformGoogleReview(review: GoogleReview) {
  return {
    id: review.reviewId,
    rating: starRatingToNumber(review.starRating),
    comment: review.comment || "",
    userName: review.reviewer?.displayName || "Anonymous",
    userPhoto: review.reviewer?.profilePhotoUrl || "",
    createdAt: review.createTime,
    source: "google" as const,
  };
}

/**
 * Fetch reviews from Google My Business API
 * 
 * @param accountId - Google My Business Account ID
 * @param locationId - Google My Business Location ID
 * @param accessToken - OAuth 2.0 access token or API key
 * @param pageSize - Number of reviews to fetch (default: 50, max: 50)
 * @param pageToken - Token for pagination
 */
export async function fetchGoogleReviews(
  accountId: string,
  locationId: string,
  accessToken: string,
  pageSize: number = 50,
  pageToken?: string
): Promise<GoogleReviewsResponse> {
  const url = new URL(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`
  );

  if (pageSize) url.searchParams.set("pageSize", pageSize.toString());
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Google My Business API error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`
    );
  }

  return response.json();
}

/**
 * Reply to a Google review
 * 
 * @param accountId - Google My Business Account ID
 * @param locationId - Google My Business Location ID
 * @param reviewId - The review ID to reply to
 * @param comment - Your reply text
 * @param accessToken - OAuth 2.0 access token
 */
export async function replyToGoogleReview(
  accountId: string,
  locationId: string,
  reviewId: string,
  comment: string,
  accessToken: string
): Promise<void> {
  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to reply to review: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`
    );
  }
}

/**
 * Delete a reply to a Google review
 * 
 * @param accountId - Google My Business Account ID
 * @param locationId - Google My Business Location ID
 * @param reviewId - The review ID
 * @param accessToken - OAuth 2.0 access token
 */
export async function deleteGoogleReviewReply(
  accountId: string,
  locationId: string,
  reviewId: string,
  accessToken: string
): Promise<void> {
  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to delete reply: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`
    );
  }
}
