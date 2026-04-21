import Settings from "@/models/Settings";

/**
 * Generate professional invoice HTML for paid orders (matches InvoiceClient.tsx A4 style)
 */
export const generateInvoiceHTML = async (order: any) => {
  // Fetch company settings
  let settings = await Settings.findOne().lean() as any;

  const defaultTaxRate = (() => {
    if (settings?.taxRates && settings.taxRates.length > 0) {
      const defaultTax =
        settings.taxRates.find((t: any) => t.isDefault) || settings.taxRates[0];
      return defaultTax.rate;
    }
    return settings?.taxRate || 5;
  })();

  if (!settings) {
    settings = {
      shopName: "Sai Nandhini Tasty World",
      contactEmail: "info@sainandhini.com",
      contactPhone: "+91 96009 16065",
      address: "# 3/81, 1st Floor, Kaveri Main Street, SRV Nagar, Thirunagar, Madurai - 625006",
      logo: "",
    };
  }

  const shopName = settings.shopName || "Sai Nandhini Tasty World";
  const shopNamePart1 = shopName.split(" ").slice(0, 2).join(" ");
  const shopNamePart2 = shopName.split(" ").slice(2).join(" ");
  const address = settings.address || "# 3/81, 1st Floor, Kaveri Main Street, SRV Nagar, Thirunagar, Madurai - 625006";
  const addressLine1 = address.split(",").slice(0, 2).join(",");
  const addressLine2 = address.split(",").slice(2).join(",");
  const contactPhone = settings.contactPhone || "+91 96009 16065";
  const contactEmail = settings.contactEmail || "info@sainandhini.com";
  const logo = settings.logo || "";

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  const itemRows = order.orderItems.map((item: any) => `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
        <div style="font-weight: 700; color: #1f2937; font-size: 14px;">${item.name}${item.uom ? ` <span style="font-weight:400;color:#9ca3af;font-size:12px;">(${item.uom})</span>` : ""}</div>
        <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">HSN: 1905</div>
      </td>
      <td style="padding: 14px 0; border-bottom: 1px solid #f3f4f6; text-align: center; font-weight: 700; color: #4b5563; font-size: 14px;">${item.qty}</td>
      <td style="padding: 14px 0; border-bottom: 1px solid #f3f4f6; text-align: right; color: #4b5563; font-size: 14px;">&#8377;${item.price.toFixed(2)}</td>
      <td style="padding: 14px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 700; color: #1f2937; font-size: 14px;">&#8377;${(item.price * item.qty).toFixed(2)}</td>
    </tr>
  `).join("");

  const discountRow = order.discount > 0 ? `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:14px;color:#ef4444;font-weight:700;">
      <span>Discount</span><span>-&#8377;${order.discount.toFixed(2)}</span>
    </div>
  ` : "";

  const taxRow = order.taxPrice > 0 ? `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:14px;color:#4b5563;">
      <span>Tax (${defaultTaxRate}%)</span><span>&#8377;${order.taxPrice.toFixed(2)}</span>
    </div>
  ` : "";

  const logoHtml = logo
    ? `<img src="${logo}" alt="Logo" style="height:64px;width:auto;object-fit:contain;display:block;margin-bottom:10px;" />`
    : "";

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${order._id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #374151;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page {
          max-width: 210mm;
          margin: 0 auto;
          padding: 36px 48px;
          background: white;
        }
      </style>
    </head>
    <body>
      <div class="page">

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e5e7eb;">
          <div>
            ${logoHtml}
            <div style="font-size:30px;font-weight:700;color:#234d1b;font-family:Georgia,serif;margin-bottom:4px;">${shopNamePart1}</div>
            <div style="font-size:15px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;">${shopNamePart2}</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.7;">
              ${addressLine1}<br>
              ${addressLine2}<br>
              Ph: ${contactPhone}<br>
              Email: ${contactEmail}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:28px;font-weight:700;color:#d1d5db;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;">Invoice</div>
            <div style="font-size:13px;margin-bottom:6px;display:flex;gap:8px;justify-content:flex-end;">
              <span style="font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;min-width:80px;text-align:right;">Invoice #</span>
              <span style="font-weight:600;color:#1f2937;font-family:monospace;">${order._id.toString().slice(-8).toUpperCase()}</span>
            </div>
            <div style="font-size:13px;margin-bottom:6px;display:flex;gap:8px;justify-content:flex-end;">
              <span style="font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;min-width:80px;text-align:right;">Date</span>
              <span style="font-weight:600;color:#1f2937;">${orderDate}</span>
            </div>
            <div style="font-size:13px;display:flex;gap:8px;justify-content:flex-end;align-items:center;">
              <span style="font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;min-width:80px;text-align:right;">Status</span>
              <span style="display:inline-block;background:${order.isPaid ? "#d1fae5" : "#fef3c7"};color:${order.isPaid ? "#059669" : "#d97706"};padding:2px 12px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${order.isPaid ? "Paid" : "Unpaid"}</span>
            </div>
          </div>
        </div>

        <!-- Bill To -->
        <div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">Bill To</div>
          <div style="font-size:18px;font-weight:700;color:#1f2937;margin-bottom:4px;">${order.shippingAddress.fullName}</div>
          <div style="font-size:14px;color:#4b5563;line-height:1.7;">
            ${order.shippingAddress.address}<br>
            ${order.shippingAddress.city} - ${order.shippingAddress.pincode}<br>
            Ph: ${order.shippingAddress.phone}<br>
            ${order.shippingAddress.email ? `Email: ${order.shippingAddress.email}` : ""}
          </div>
        </div>

        <!-- Items Table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="border-bottom:2px solid #f3f4f6;">
              <th style="padding:12px 0;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;text-align:left;">Item Description</th>
              <th style="padding:12px 0;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;text-align:center;">Qty</th>
              <th style="padding:12px 0;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;text-align:right;">Price</th>
              <th style="padding:12px 0;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
          <div style="width:280px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:14px;color:#4b5563;">
              <span>Subtotal</span><span>&#8377;${order.itemsPrice.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:14px;color:#4b5563;">
              <span>Shipping</span><span>${order.shippingPrice > 0 ? `&#8377;${order.shippingPrice.toFixed(2)}` : "FREE"}</span>
            </div>
            ${taxRow}
            ${discountRow}
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:2px solid #f3f4f6;margin-top:8px;padding-top:16px;font-size:20px;font-weight:700;color:#234d1b;">
              <span>Total</span><span>&#8377;${order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align:center;border-top:1px solid #f3f4f6;padding-top:16px;color:#9ca3af;font-size:11px;line-height:1.8;page-break-inside:avoid;">
          <div style="font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Thank you for your business!</div>
          <div>For any queries, please contact ${contactEmail}</div>
          <div style="margin-top:12px;font-size:10px;color:#d1d5db;">Computer generated invoice. No signature required.</div>
        </div>

      </div>
    </body>
    </html>
  `;

  return invoiceHTML;
};
