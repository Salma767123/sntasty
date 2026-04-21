/**
 * Review Matcher Utility
 * Extracts keywords from a product name and scores Google reviews
 * by keyword relevance to determine the most relevant reviews to show.
 */

// Common stop words to ignore when extracting keywords
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "be", "been", "has",
  "have", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "shall", "can", "our", "your", "my", "its", "it",
]);

// Product category keyword mappings – expand to map generic product descriptors
// to related review keywords customers might naturally use
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Cookies / biscuits
  cookie: ["cookie", "cookies", "biscuit", "biscuits", "snack", "crunchy", "crispy", "sweet", "baked"],
  biscuit: ["biscuit", "biscuits", "cookie", "cookies", "crispy", "crunchy", "snack"],

  // Cakes
  cake: ["cake", "cakes", "pastry", "sweet", "dessert", "birthday"],
  cupcake: ["cupcake", "cupcakes", "cake", "frosting", "icing", "sweet"],

  // Bread / roti
  bread: ["bread", "loaf", "toast", "soft", "baked", "wheat", "multigrain"],
  roti: ["roti", "chapati", "flatbread", "wheat", "fresh"],

  // Sweets / traditional
  ladoo: ["ladoo", "laddu", "sweet", "traditional", "festive", "ghee"],
  halwa: ["halwa", "halva", "sweet", "dessert", "traditional"],
  barfi: ["barfi", "burfi", "sweet", "milk", "traditional"],
  murukku: ["murukku", "snack", "crispy", "crunchy", "traditional", "rice"],
  chakli: ["chakli", "murukku", "snack", "crispy", "crunchy"],

  // Peanut / nuts
  peanut: ["peanut", "groundnut", "nut", "nutty", "crunchy", "protein"],
  almond: ["almond", "badam", "nut", "nutty"],
  cashew: ["cashew", "kaju", "nut"],
  dry: ["dry", "dried", "dehydrated"],

  // Wheat / grain
  wheat: ["wheat", "atta", "whole grain", "healthy", "nutritious", "multigrain"],
  oats: ["oats", "oatmeal", "healthy", "nutritious", "fiber"],
  millet: ["millet", "ragi", "bajra", "healthy", "traditional", "nutritious"],
  ragi: ["ragi", "millet", "finger millet", "healthy", "traditional"],

  // Chocolates
  chocolate: ["chocolate", "choco", "dark", "cocoa", "sweet", "smooth"],

  // Snacks / namkeen
  snack: ["snack", "snacks", "namkeen", "crispy", "crunch", "savory", "tasty"],
  namkeen: ["namkeen", "snack", "savory", "crispy", "salty"],

  // General food
  fresh: ["fresh", "freshly", "made", "daily", "homemade"],
  homemade: ["homemade", "home", "made", "fresh", "artisanal", "handmade"],
  organic: ["organic", "natural", "healthy", "pure", "fresh", "chemical-free"],
  healthy: ["healthy", "nutritious", "organic", "natural", "good"],
  traditional: ["traditional", "authentic", "heritage", "homemade", "grandma"],
};

/**
 * Extracts meaningful keywords from a product name
 */
export function extractProductKeywords(productName: string): string[] {
  const normalized = productName.toLowerCase().trim();
  const words = normalized.split(/[\s\-_,]+/);

  const keywords = new Set<string>();

  for (const word of words) {
    if (!word || STOP_WORDS.has(word) || word.length < 3) continue;

    // Add the word itself
    keywords.add(word);

    // Add mapped category keywords
    if (CATEGORY_KEYWORDS[word]) {
      CATEGORY_KEYWORDS[word].forEach((kw) => keywords.add(kw));
    }

    // Partial matching - check if any category key is a substring of this word
    for (const [key, related] of Object.entries(CATEGORY_KEYWORDS)) {
      if (word.includes(key) || key.includes(word)) {
        keywords.add(key);
        related.forEach((kw) => keywords.add(kw));
      }
    }
  }

  return Array.from(keywords);
}

export interface GoogleReview {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  userPhoto?: string;
  createdAt: string;
  source: string;
}

export interface ScoredReview extends GoogleReview {
  relevanceScore: number;
  matchedKeywords: string[];
}

/**
 * Scores and filters Google reviews based on product name relevance.
 * Returns reviews sorted by relevance, with a minimum threshold.
 */
export function scoreReviewsForProduct(
  reviews: GoogleReview[],
  productName: string,
  minScore: number = 0,
): ScoredReview[] {
  const keywords = extractProductKeywords(productName);

  const scored: ScoredReview[] = reviews.map((review) => {
    const commentLower = (review.comment || "").toLowerCase();
    const matched: string[] = [];
    let score = 0;

    for (const keyword of keywords) {
      if (commentLower.includes(keyword)) {
        matched.push(keyword);
        // Longer/more specific matches get higher scores
        score += keyword.length > 4 ? 2 : 1;
      }
    }

    // Bonus: high-rated reviews get a small boost (prefer positive matches)
    if (score > 0 && review.rating >= 4) {
      score += 0.5;
    }

    return {
      ...review,
      relevanceScore: score,
      matchedKeywords: matched,
    };
  });

  return scored
    .filter((r) => r.relevanceScore > minScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Returns a fallback set of reviews when no strong keyword matches exist.
 * Falls back to highest-rated reviews.
 */
export function getFallbackReviews(
  reviews: GoogleReview[],
  limit: number = 3,
): ScoredReview[] {
  return [...reviews]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit)
    .map((r) => ({
      ...r,
      relevanceScore: 0,
      matchedKeywords: [],
    }));
}
