import Order from "@/models/Order";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import StockTransaction from "@/models/StockTransaction";

/**
 * Atomically decrement product stock for an order — idempotent.
 * Uses Order.stockDecremented flag claimed via findOneAndUpdate.
 * Returns true if this call performed the decrement, false if already done or order not eligible.
 */
export async function decrementOrderStock(orderId: string): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, isPaid: true, stockDecremented: false },
    { $set: { stockDecremented: true } },
    { new: false },
  );

  if (!claimed || claimed.stockDecremented) return false;

  for (const item of claimed.orderItems || []) {
    try {
      // Sanitize quantity — protect against NaN / negative / non-integer
      const qty = Number(item.qty);
      if (!Number.isFinite(qty) || qty <= 0) {
        console.warn(
          `[payment-finalize] Skipping invalid qty for product ${item.product} on order ${claimed._id}: ${item.qty}`,
        );
        continue;
      }

      const product = await Product.findById(item.product);
      if (!product) {
        console.warn(
          `[payment-finalize] Product ${item.product} not found for order ${claimed._id}`,
        );
        continue;
      }

      const hasVariants = product.variants && product.variants.length > 0;

      if (hasVariants) {
        if (!item.uom) {
          console.warn(
            `[payment-finalize] Product ${product._id} has variants but order item has no uom; skipping (order ${claimed._id})`,
          );
          continue;
        }
        const variantIndex = product.variants.findIndex(
          (v: any) => v.uom === item.uom,
        );
        if (variantIndex === -1) {
          console.warn(
            `[payment-finalize] Variant '${item.uom}' not found for product ${product._id}; skipping (order ${claimed._id})`,
          );
          continue;
        }
        const previousStock = product.variants[variantIndex].stock || 0;
        const newStock = Math.max(0, previousStock - qty);
        product.variants[variantIndex].stock = newStock;
        await product.save();
        try {
          await StockTransaction.create({
            product: product._id,
            productName: product.name,
            variantSku: item.uom,
            type: "Sale",
            quantity: -qty,
            previousStock,
            newStock,
            reference: String(claimed._id),
          });
        } catch {}
      } else {
        const previousStock = product.stock || 0;
        const newStock = Math.max(0, previousStock - qty);
        await Product.findByIdAndUpdate(product._id, { stock: newStock });
        try {
          await StockTransaction.create({
            product: product._id,
            productName: product.name,
            type: "Sale",
            quantity: -qty,
            previousStock,
            newStock,
            reference: String(claimed._id),
          });
        } catch {}
      }
    } catch (err) {
      console.error(
        `[payment-finalize] Failed to decrement stock for product ${item.product}:`,
        err,
      );
    }
  }

  return true;
}

/**
 * Atomically apply coupon usage for an order — idempotent.
 * Uses Order.couponApplied flag claimed via findOneAndUpdate.
 * Returns true if applied this call, false if already done or no coupon on order.
 */
export async function applyCouponUsage(orderId: string): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, isPaid: true, couponApplied: false, couponCode: { $ne: null } },
    { $set: { couponApplied: true } },
    { new: false },
  );

  if (!claimed || claimed.couponApplied || !claimed.couponCode) return false;

  try {
    const coupon = await Coupon.findOne({ code: claimed.couponCode.toUpperCase() });
    if (!coupon) return false;

    coupon.usedCount = (coupon.usedCount || 0) + 1;

    if (claimed.user) {
      const userIdStr = claimed.user.toString();
      const userUsageIndex = coupon.usedByUsers?.findIndex(
        (u: any) => u.userId.toString() === userIdStr,
      );
      if (userUsageIndex !== undefined && userUsageIndex >= 0) {
        coupon.usedByUsers[userUsageIndex].count += 1;
        coupon.usedByUsers[userUsageIndex].lastUsedAt = new Date();
      } else {
        if (!coupon.usedByUsers) coupon.usedByUsers = [];
        coupon.usedByUsers.push({
          userId: claimed.user,
          count: 1,
          lastUsedAt: new Date(),
        });
      }
    }
    await coupon.save();
    return true;
  } catch (err) {
    console.error(`[payment-finalize] Failed to update coupon for order ${orderId}:`, err);
    await Order.findByIdAndUpdate(orderId, { couponApplied: false });
    return false;
  }
}

/**
 * Atomically claim invoice email sending — idempotent.
 * Returns true if THIS call should send the email; false if already claimed.
 */
export async function claimInvoiceEmail(orderId: string): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, invoiceEmailSent: false },
    { $set: { invoiceEmailSent: true, invoiceEmailSentAt: new Date() } },
    { new: false },
  );
  return !!(claimed && !claimed.invoiceEmailSent);
}

/**
 * Rollback invoice email claim if sending failed.
 */
export async function releaseInvoiceEmailClaim(orderId: string): Promise<void> {
  await Order.findByIdAndUpdate(orderId, {
    invoiceEmailSent: false,
    invoiceEmailSentAt: null,
  });
}

/**
 * Send order confirmation + admin notification with PDF invoice.
 * Caller should atomically claim email via claimInvoiceEmail first.
 */
export async function sendOrderEmails(orderId: string): Promise<void> {
  try {
    const populatedOrder = await Order.findById(orderId).populate("user");
    if (!populatedOrder) return;

    const { sendOrderConfirmationEmail, sendAdminNewOrderEmail } = await import(
      "@/lib/email-service"
    );

    let pdfBuffer: Buffer | null = null;
    try {
      const { generateInvoiceHTML } = await import("@/lib/invoice-generator");
      const { generatePDFFromHTML } = await import("@/lib/pdf-generator");
      const invoiceHTML = await generateInvoiceHTML(populatedOrder);
      pdfBuffer = await generatePDFFromHTML(invoiceHTML);
    } catch (pdfError) {
      console.warn(
        "⚠️ PDF generation failed, sending email without attachment:",
        (pdfError as Error).message,
      );
    }

    await sendOrderConfirmationEmail(populatedOrder, pdfBuffer);
    await sendAdminNewOrderEmail(populatedOrder, pdfBuffer);
  } catch (err) {
    console.error(`[payment-finalize] sendOrderEmails failed for ${orderId}:`, err);
    throw err;
  }
}

/**
 * Atomically claim the "paid" transition. Returns true if this call won the race.
 * Side effects (stock, coupon, email) should ONLY run when this returns true.
 */
export async function claimOrderPaid(
  orderId: string,
  paymentResult: { id: string; status: string; email_address?: string },
): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, isPaid: false },
    {
      $set: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult: {
          id: paymentResult.id,
          status: paymentResult.status || "completed",
          email_address: paymentResult.email_address || "",
        },
      },
    },
    { new: false },
  );
  return !!(claimed && !claimed.isPaid);
}

/**
 * Run the full post-payment finalization: stock + coupon + email (atomic, idempotent).
 * Safe to call multiple times — only effective work runs once per order.
 */
export async function finalizePaidOrder(orderId: string): Promise<void> {
  await Promise.allSettled([
    decrementOrderStock(orderId),
    applyCouponUsage(orderId),
  ]);

  const shouldSendEmail = await claimInvoiceEmail(orderId);
  if (shouldSendEmail) {
    try {
      await sendOrderEmails(orderId);
    } catch {
      await releaseInvoiceEmailClaim(orderId);
    }
  }
}
