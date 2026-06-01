/**
 * Shipping calculation helpers — shared by checkout (client) and order APIs (server).
 * All weights are in grams. Rates are in the store currency (₹).
 */

export interface WeightSlab {
  upToGrams: number;
  rate: number;
}

export interface ShippingRateLike {
  location: string;
  estimatedDelivery?: string;
  rate?: number; // legacy flat rate
  weightSlabs?: WeightSlab[];
  extraPerHalfKgRate?: number;
}

/**
 * Map of UOM name -> weight in grams (e.g. { "1/2 kg": 500, "1 kg": 1000 }).
 */
export type UomWeightMap = Record<string, number>;

/**
 * Build a UOM-name -> grams lookup from raw UOM docs.
 */
export function buildUomWeightMap(uoms: any[]): UomWeightMap {
  const map: UomWeightMap = {};
  for (const u of uoms || []) {
    if (u && u.name) map[u.name] = Number(u.weightInGrams) || 0;
  }
  return map;
}

/**
 * Total weight (grams) of a cart/order: Σ(uom weight × qty).
 * Items whose uom has no weight configured contribute 0.
 */
export function calcCartWeightGrams(
  items: Array<{ uom?: string; qty: number }>,
  weightMap: UomWeightMap,
): number {
  return (items || []).reduce((sum, it) => {
    const grams = (it.uom && weightMap[it.uom]) || 0;
    const qty = Number(it.qty) || 0;
    return sum + grams * qty;
  }, 0);
}

/**
 * Resolve the shipping charge for a given total weight against a state's rate config.
 * Returns null only when no rate config is supplied.
 *
 * Rules:
 *  - No weightSlabs -> fall back to legacy flat `rate`.
 *  - Otherwise pick the smallest slab whose upToGrams >= totalGrams.
 *  - Beyond the top slab: if extraPerHalfKgRate > 0, add it per extra ½kg (rounded up);
 *    else cap at the top slab's rate.
 */
export function calcShippingForWeight(
  totalGrams: number,
  shippingRate: ShippingRateLike | null | undefined,
): number | null {
  if (!shippingRate) return null;

  const slabs = [...(shippingRate.weightSlabs || [])]
    .filter((s) => typeof s.upToGrams === "number" && typeof s.rate === "number")
    .sort((a, b) => a.upToGrams - b.upToGrams);

  if (slabs.length === 0) {
    return typeof shippingRate.rate === "number" ? shippingRate.rate : 0;
  }

  const weight = Math.max(0, Number(totalGrams) || 0);

  for (const slab of slabs) {
    if (weight <= slab.upToGrams) return slab.rate;
  }

  const top = slabs[slabs.length - 1];
  const extra = Number(shippingRate.extraPerHalfKgRate) || 0;
  if (extra > 0) {
    const extraGrams = weight - top.upToGrams;
    const halfKgUnits = Math.ceil(extraGrams / 500);
    return top.rate + halfKgUnits * extra;
  }
  return top.rate;
}

/**
 * Find the applicable ShippingRate for a state: exact match first,
 * then the "Other States" catch-all.
 */
export function findShippingRateForState(
  rates: ShippingRateLike[] | null | undefined,
  state: string | null | undefined,
): ShippingRateLike | null {
  if (!rates || !state) return null;
  const exact = rates.find((r) => r.location === state);
  if (exact) return exact;
  return rates.find((r) => r.location === "Other States") || null;
}
