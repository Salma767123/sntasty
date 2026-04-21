// Shared in-memory cache with invalidation support
// Used by data.ts (public data) and layout.tsx (navbar/seo)

import { revalidatePath } from "next/cache";

const store: Record<string, { data: any; expiry: number }> = {};

export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const entry = store[key];
  if (entry && entry.expiry > now) return entry.data as T;
  const data = await fn();
  store[key] = { data, expiry: now + ttlMs };
  return data;
}

export function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): () => Promise<T> {
  return () => cached(key, ttlMs, fn);
}

// Invalidate specific cache keys or all keys matching a prefix
export function invalidateCache(...keys: string[]) {
  if (keys.length === 0) {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    return;
  }
  for (const key of keys) {
    if (store[key]) {
      delete store[key];
    }
    for (const storeKey of Object.keys(store)) {
      if (storeKey.startsWith(key)) {
        delete store[storeKey];
      }
    }
  }
}

// Cache key constants
export const CACHE_KEYS = {
  PRODUCTS: "products",
  FEATURED: "featured-",
  CATEGORIES: "categories",
  SETTINGS_PUBLIC: "settings-public",
  HERO_SLIDES: "hero-slides",
  PRODUCT_SLUG: "product-",
  SEO: "seo",
  NAVBAR: "navbar",
} as const;

// Centralized revalidation — invalidates in-memory cache + Next.js ISR cache in one call
// Call this from admin API routes after mutations
export function revalidatePublicData(
  cacheKeys: string[],
  paths: string[] = ["/", "/shop"],
) {
  // 1. Clear in-memory cache
  invalidateCache(...cacheKeys);
  // 2. Revalidate Next.js ISR cache for affected paths
  for (const path of paths) {
    revalidatePath(path);
  }
  // 3. Revalidate the root layout to bust navbar/seo cache on next navigation
  revalidatePath("/", "layout");
}
