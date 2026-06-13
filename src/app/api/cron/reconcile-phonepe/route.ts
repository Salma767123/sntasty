import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { reconcilePhonePeOrder, type ReconcileResult } from "@/lib/phonepe-reconcile";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Reconciliation sweep for PhonePe orders that were genuinely paid but never got
 * marked paid (browser never returned AND webhook missed/unconfigured). This is the
 * durable self-healing backstop — independent of both the client redirect and the webhook.
 *
 * Trigger options (any one):
 *   - Vercel Cron: add to vercel.json (sends `Authorization: Bearer $CRON_SECRET`).
 *   - Any external cron / uptime monitor: GET/POST with `Authorization: Bearer <CRON_SECRET>`.
 *   - A logged-in admin (manual trigger from the dashboard).
 */
async function isAuthorized(req: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session && (session.user as any).role === "admin") return true;
  } catch {
    // ignore — fall through to unauthorized
  }
  return false;
}

async function handle(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const now = Date.now();
    const minAgeMs = 2 * 60 * 1000; // skip very fresh orders — customer may still be paying
    const maxAgeMs = 24 * 60 * 60 * 1000; // skip stale abandoned orders beyond a day

    const stuck = await Order.find({
      paymentMethod: "PhonePe",
      isPaid: false,
      createdAt: { $gte: new Date(now - maxAgeMs), $lte: new Date(now - minAgeMs) },
    })
      .select("_id")
      .sort({ createdAt: -1 })
      .limit(50);

    const results: ReconcileResult[] = [];
    for (const o of stuck) {
      try {
        results.push(await reconcilePhonePeOrder(String(o._id)));
      } catch (err: any) {
        results.push({
          orderId: String(o._id),
          outcome: "status_error",
          detail: err?.message || "reconcile threw",
        });
      }
    }

    const markedPaid = results.filter((r) => r.outcome === "marked_paid").length;
    const stillPending = results.filter((r) => r.outcome === "pending").length;

    if (markedPaid > 0) {
      console.log(`[reconcile-phonepe] Recovered ${markedPaid}/${stuck.length} stuck order(s)`);
    }

    return NextResponse.json({
      checked: stuck.length,
      markedPaid,
      stillPending,
      results,
    });
  } catch (error: any) {
    console.error("[reconcile-phonepe] sweep error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
