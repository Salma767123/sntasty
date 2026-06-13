import Order from "@/models/Order";
import { getDecryptedPhonePeConfig, fetchPhonePeOrderStatus } from "@/lib/phonepe";
import { claimOrderPaid, finalizePaidOrder } from "@/lib/payment-finalize";

export type ReconcileOutcome =
  | "already_paid"
  | "marked_paid"
  | "pending"
  | "failed"
  | "not_found"
  | "no_merchant_id"
  | "config_missing"
  | "status_error";

export interface ReconcileResult {
  orderId: string;
  outcome: ReconcileOutcome;
  state?: string;
  detail?: string;
}

/**
 * Verify a single PhonePe order against PhonePe's authoritative Order Status API and,
 * if COMPLETED, atomically mark it paid + run finalization (stock, coupon, emails).
 *
 * This is the durable backstop for the two unreliable "mark paid" paths:
 *   - the client redirect callback (browser may never return, esp. mobile UPI), and
 *   - the webhook (may be unregistered / uncredentialled / a single delivery missed).
 *
 * Fully idempotent — safe to call repeatedly. Used by the reconciliation cron and the
 * admin "re-check payment" action. The merchantOrderId is read from order.paymentResult.id,
 * which holds the original MO… id for any not-yet-paid order (the callback/webhook no longer
 * overwrite it on non-success).
 */
export async function reconcilePhonePeOrder(orderId: string): Promise<ReconcileResult> {
  const order = await Order.findById(orderId);
  if (!order) return { orderId, outcome: "not_found" };
  if (order.isPaid) return { orderId, outcome: "already_paid" };

  const merchantOrderId = order.paymentResult?.id;
  if (!merchantOrderId) return { orderId, outcome: "no_merchant_id" };

  const config = await getDecryptedPhonePeConfig();
  if (!config) return { orderId, outcome: "config_missing" };

  const status = await fetchPhonePeOrderStatus(config, String(merchantOrderId));
  if (!status.ok) {
    return { orderId, outcome: "status_error", state: status.state, detail: status.error };
  }

  if (status.state === "COMPLETED") {
    const won = await claimOrderPaid(orderId, {
      id: status.phonepeTxnId || String(merchantOrderId),
      status: "completed",
      email_address: order.shippingAddress?.email || "",
    });
    // Run finalize regardless of who won the claim — it is idempotent and covers
    // any partial prior run (e.g. paid flag set but emails/stock not yet done).
    await finalizePaidOrder(orderId);
    return {
      orderId,
      outcome: "marked_paid",
      state: "COMPLETED",
      detail: won ? "claimed" : "already_claimed",
    };
  }

  if (status.state === "PENDING") {
    // Still settling — record but leave isPaid=false and KEEP the MO id for the next sweep.
    await Order.findByIdAndUpdate(orderId, { "paymentResult.status": "pending" });
    return { orderId, outcome: "pending", state: "PENDING" };
  }

  // FAILED / other — record the status but do NOT overwrite paymentResult.id,
  // so a later genuine settlement can still be matched by the MO id.
  await Order.findByIdAndUpdate(orderId, {
    "paymentResult.status": String(status.state).toLowerCase(),
  });
  return { orderId, outcome: "failed", state: status.state };
}
