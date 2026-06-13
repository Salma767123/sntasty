import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { invalidateCache, CACHE_KEYS } from "@/lib/cache";
import { reconcilePhonePeOrder } from "@/lib/phonepe-reconcile";

/**
 * Admin action: re-check a single PhonePe order against PhonePe's Order Status API and,
 * if genuinely COMPLETED, mark it paid + finalize (stock, coupon, invoice email).
 * Idempotent. Use this to recover an order that was paid but stuck on isPaid=false.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const result = await reconcilePhonePeOrder(id);

    if (result.outcome === "marked_paid" || result.outcome === "already_paid") {
      invalidateCache(CACHE_KEYS.PRODUCTS, CACHE_KEYS.FEATURED, CACHE_KEYS.PRODUCT_SLUG);
      revalidatePath("/orders");
      revalidatePath(`/orders/${id}`);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[recheck-payment] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
