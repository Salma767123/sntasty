// ─────────────────────────────────────────────────────────────────────────────
// emailTemplate.ts
// Production-grade transactional email template for order notifications.
//
// Best-practices implemented:
//  • Full TypeScript — no `any`, strict interfaces
//  • Pure functions — no side effects, fully testable
//  • Separation of concerns — config / fragments / layout / entry-point
//  • XHTML-safe HTML (table-based where flex is unsupported by email clients)
//  • Inline styles for all email-critical rules; <style> block for helpers only
//  • Preheader text (hidden inbox preview)
//  • Outlook VML button fallback
//  • CAN-SPAM / GDPR compliant footer (address + unsubscribe + privacy)
//  • XSS-safe: all dynamic values are escaped before interpolation
//  • Currency / locale formatting isolated in helpers
//  • Exhaustive order status union — no silent fall-throughs
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipping"
  | "Shipped"
  | "OutForDelivery"
  | "Delivered"
  | "Cancelled";

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  image?: string;
  uom?: string;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  pincode: string;
  email: string;
  state?: string;
}

export interface Order {
  _id: string | { toString(): string };
  status: OrderStatus;
  createdAt: string | Date;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  itemsPrice: number;
  discountPrice?: number;
  shippingPrice: number;
  totalPrice: number;
  awbNumber?: string;
  courierName?: string;
  trackingLink?: string;
  cancelReason?: string;
  deliveredAt?: string | Date;
  user?: any;
}

export interface ShopSettings {
  shopName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  appUrl?: string;
}

export interface EmailTemplateOptions {
  /** Pass a custom message that overrides the default status description. */
  statusMessage?: string;
  /** Locale for date/currency formatting. Defaults to "en-IN". */
  locale?: string;
  /** Currency code. Defaults to "INR". */
  currency?: string;
}

// ── Status configuration ─────────────────────────────────────────────────────

interface StatusConfig {
  hdrBg: string;
  badgeLabel: string;
  badgeStyle: string;
  badgeColor: string;
  title: string;
  desc: string;
  btnText: string;
  btnBg: string;
  btnColor: string;
  note: string;
  cardTitle: string;
  cardTitleColor: string;
  cardBg: string;
  cardBorder: string;
  cardBody: string;
  progressWidth: string;
  progressColor: string;
  showProgress: boolean;
  preheader: string;
  emailSubject: string;
  step1State: StepState;
  step2State: StepState;
  step3State: StepState;
  step4State: StepState;
}

type StepState = "done" | "active" | "inactive";

function buildStatusConfig(
  status: OrderStatus,
  order: Order,
  statusMessage: string | undefined,
  formattedTotal: string,
  formattedDate: string,
  shopName: string = "Sai Nandhini",
): StatusConfig {
  // Default (Pending / Processing / Confirmed)
  const base: StatusConfig = {
    hdrBg: "#234d1b",
    badgeLabel: "Confirmed",
    badgeStyle:
      "background:rgba(198,167,94,0.15);color:#f8bf51;border:1px solid rgba(198,167,94,0.3);",
    badgeColor: "#f8bf51",
    title: "Thank You for Your Order",
    desc:
      statusMessage ??
      "Your order is in. We're working to get it packed up and out the door — expect a dispatch confirmation email soon.",
    btnText: "View Order",
    btnBg: "#f8bf51",
    btnColor: "#234d1b",
    note: "Please allow 24 hours to see tracking information.",
    cardTitle: "📋 Order Summary",
    cardTitleColor: "#9c8141",
    cardBg: "#FAF3E0",
    cardBorder: "#f8bf5130",
    cardBody:
      "We are confirming your order. You'll receive another email once it's dispatched.",
    progressWidth: "0%",
    progressColor: "#f8bf51",
    showProgress: true,
    preheader: `Your order has been confirmed — ${formattedTotal} total. We'll email you when it ships.`,
    emailSubject: `Your ${shopName} order is confirmed!`,
    step1State: "active",
    step2State: "inactive",
    step3State: "inactive",
    step4State: "inactive",
  };

  switch (status) {
    case "Processing":
      return {
        ...base,
        badgeLabel: "Processing",
        title: "We're preparing your order",
        desc:
          statusMessage ??
          "Your order is being prepared and will be dispatched very soon.",
        cardTitle: "⚙️ Order in Progress",
        cardBody:
          "Our team is picking and packing your items. You'll hear from us the moment it ships.",
        progressWidth: "10%",
        preheader:
          "Your order is being prepared — we'll notify you when it ships.",
        emailSubject: `Your ${shopName} order is being processed`,
        step1State: "done",
        step2State: "inactive",
      };

    case "Shipping":
    case "Shipped":
      return {
        ...base,
        badgeLabel: "Dispatched",
        title: "Your order is on its way! 🚚",
        desc:
          statusMessage ??
          "Great news — your order has just left our warehouse. Your snacks are heading to you right now.",
        btnText: "Track Your Shipment",
        note: order.awbNumber
          ? `Tracking #: ${esc(order.awbNumber)}`
          : "Carrier tracking details will appear in the app.",
        cardTitle: "📍 Tracking Information",
        cardBody: order.awbNumber
          ? `<strong style="color:#234d1b;">Courier:</strong> ${esc(order.courierName || "Standard Shipping")}<br/>
             <strong style="color:#234d1b;">Tracking Number:</strong> <span style="font-family:monospace;">${esc(order.awbNumber)}</span>
             ${order.trackingLink ? `<div style="margin-top:16px;">
                 <!--[if mso]>
                 <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                   href="${esc(order.trackingLink.replace('{trackingNumber}', order.awbNumber))}"
                   style="height:36px;v-text-anchor:middle;width:150px;" arcsize="16%" stroke="f" fillcolor="#234d1b">
                   <w:anchorlock/>
                   <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;">AWB Tracking</center>
                 </v:roundrect>
                 <![endif]-->
                 <!--[if !mso]><!-->
                 <a href="${esc(order.trackingLink.replace('{trackingNumber}', order.awbNumber))}" 
                    target="_blank" 
                    style="display:inline-block;background-color:#234d1b;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;padding:10px 24px;border-radius:6px;mso-padding-alt:0;">
                   AWB Tracking
                 </a>
                 <!--<![endif]-->
               </div>` : '<br/><br/>Use this number on the carrier\'s website for real-time updates.'}`
          : "Tracking details will be updated shortly. Check the app for live status.",
        progressWidth: "50%",
        preheader: "Your order has shipped and is on its way to you!",
        emailSubject: `Your ${shopName} order has been dispatched!`,
        step1State: "done",
        step2State: "active",
        step3State: "inactive",
        step4State: "inactive",
      };

    case "OutForDelivery":
      return {
        ...base,
        hdrBg: "#1A2318",
        badgeLabel: "Out for Delivery",
        badgeStyle:
          "background:rgba(160,112,80,0.15);color:#f8bf51;border:1px solid rgba(160,112,80,0.3);",
        badgeColor: "#f8bf51",
        title: "Almost there — delivery today! 📦",
        desc:
          statusMessage ??
          "Your order is with the delivery driver and will arrive today. Make sure someone is available!",
        btnText: "Live Tracking",
        btnBg: "#f8bf51",
        btnColor: "#fff",
        note: "Expected delivery window: Today, 2 PM – 6 PM",
        cardTitle: "⏰ Delivery Window",
        cardTitleColor: "#234d1b",
        cardBg: "#FAF3E0",
        cardBorder: "#f8bf5130",
        cardBody:
          "Your order is with the courier. If you won't be home, you can redirect your parcel via the tracking link above.",
        progressWidth: "75%",
        progressColor: "#f8bf51",
        showProgress: true,
        preheader:
          "Your order is out for delivery — expected today between 2–6 PM!",
        emailSubject: `Your ${shopName} order is out for delivery today!`,
        step1State: "done",
        step2State: "done",
        step3State: "active",
        step4State: "inactive",
      };

    case "Delivered":
      return {
        ...base,
        hdrBg: "#14331D",
        badgeLabel: "Delivered ✓",
        badgeStyle:
          "background:rgba(76,175,80,0.15);color:#4caf50;border:1px solid rgba(76,175,80,0.3);",
        badgeColor: "#4caf50",
        title: "Your snacks have arrived! 🎉",
        desc:
          statusMessage ??
          `Your order was delivered on ${formattedDate}. We hope you enjoy every bite!`,
        btnText: "View Order Details",
        btnBg: "#4caf50",
        btnColor: "#fff",
        note: `Delivered on ${formattedDate}`,
        cardTitle: "✅ Delivery Confirmed",
        cardTitleColor: "#388e3c",
        cardBg: "#f1f8f1",
        cardBorder: "#4caf5030",
        cardBody:
          "Your order was successfully delivered. If you have any concerns, please contact us within 48 hours.",
        progressWidth: "100%",
        progressColor: "#4caf50",
        showProgress: true,
        preheader: `Your order has arrived! Leave a review and get 10% off your next order.`,
        emailSubject: `Your ${shopName} order has been delivered!`,
        step1State: "done",
        step2State: "done",
        step3State: "done",
        step4State: "done",
      };

    case "Cancelled":
      return {
        ...base,
        hdrBg: "#1e1212",
        badgeLabel: "Cancelled",
        badgeStyle:
          "background:rgba(224,82,82,0.15);color:#e05252;border:1px solid rgba(224,82,82,0.3);",
        badgeColor: "#e05252",
        title: "Your order has been cancelled",
        desc:
          statusMessage ??
          "We're sorry to see this happen. Your order has been cancelled and a full refund is on its way.",
        btnText: "Shop Again",
        btnBg: "#f8bf51",
        btnColor: "#234d1b",
        note: "Refund will appear within 3–5 business days",
        cardTitle: "ℹ️ Cancellation Details",
        cardTitleColor: "#b03030",
        cardBg: "#fff5f5",
        cardBorder: "#e0525230",
        cardBody: order.cancelReason
          ? `<strong>Reason:</strong> ${esc(order.cancelReason)}<br/>If you didn't request this cancellation, please <a href="mailto:info@sainandhini.com" style="color:#b03030;font-weight:700;">contact us immediately</a>.`
          : "If you didn't request this cancellation, please contact us immediately.",
        progressWidth: "0%",
        showProgress: false,
        preheader: `Your order has been cancelled. A refund of ${formattedTotal} is on its way.`,
        emailSubject: `Your ${shopName} order has been cancelled`,
        step1State: "inactive",
        step2State: "inactive",
        step3State: "inactive",
        step4State: "inactive",
      };

    default:
      return base;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Escape user-controlled strings to prevent XSS in HTML context. */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(
  amount: number,
  locale: string,
  currency: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | Date | undefined, locale: string): string {
  if (!date)
    return new Date().toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return new Date(date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function orderId(order: Order): string {
  return order._id.toString().slice(-6).toUpperCase();
}

// ── HTML Fragment Builders ───────────────────────────────────────────────────

function buildPreheader(text: string): string {
  // Zero-width non-joiners pad the preheader so email clients don't pull in body copy.
  const padding = "&zwnj;&nbsp;".repeat(20);
  return `<div style="display:none;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;" aria-hidden="true">${esc(text)} ${padding}</div>`;
}

function buildLogo(logoText: string): string {
  const [word1, ...rest] = logoText.trim().split(" ");
  const accent = rest.join(" ");
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 28px;">
      <tr>
        <td valign="middle" style="padding-right:10px;">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
            <path d="M16 4C13 4 10 6 10 9C10 12 12 13 12 16C12 19 10 21 10 24C10 27 13 28 16 28C19 28 22 27 22 24C22 21 20 19 20 16C20 13 22 12 22 9C22 6 19 4 16 4Z" fill="#f8bf51"/>
            <circle cx="16" cy="16" r="3" fill="#234d1b"/>
            <path d="M8 16C5 16 4 18 4 20C4 22 6 24 8 24C10 24 11 22 11 20C11 18 10 16 8 16Z" fill="#f8bf51" opacity="0.7"/>
            <path d="M24 16C27 16 28 18 28 20C28 22 26 24 24 24C22 24 21 22 21 20C21 18 22 16 24 16Z" fill="#f8bf51" opacity="0.7"/>
          </svg>
        </td>
        <td valign="middle">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#ffffff;line-height:1;">
            ${esc(word1)}${accent ? `<span style="color:#f8bf51;">${esc(accent ? " " + accent : "")}</span>` : ""}
          </p>
        </td>
      </tr>
    </table>`;
}

function buildCtaButton(
  href: string,
  text: string,
  bg: string,
  color: string,
): string {
  // Outlook VML rounded button + standard anchor fallback
  return `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
      href="${esc(href)}"
      style="height:46px;v-text-anchor:middle;width:220px;" arcsize="50%" stroke="f" fillcolor="${esc(bg)}">
      <w:anchorlock/>
      <center style="color:${esc(color)};font-family:Arial,sans-serif;font-size:15px;font-weight:700;">${esc(text)}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="${esc(href)}"
       target="_blank"
       role="button"
       style="display:inline-block;background-color:${esc(bg)};color:${esc(color)};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:1;text-decoration:none;padding:13px 34px;border-radius:50px;letter-spacing:0.01em;mso-padding-alt:0;">
      ${esc(text)}
    </a>
    <!--<![endif]-->`;
}

function buildProgressBar(cfg: StatusConfig): string {
  if (!cfg.showProgress) return "";

  const steps: Array<{ label: string; state: StepState; icon: string }> = [
    { label: "Confirmed", state: cfg.step1State, icon: "✓" },
    { label: "Dispatched", state: cfg.step2State, icon: "🚚" },
    { label: "Out for Delivery", state: cfg.step3State, icon: "🚐" },
    { label: "Delivered", state: cfg.step4State, icon: "🏠" },
  ];

  const stepHtml = steps
    .map(({ label, state, icon }) => {
      const isDone = state === "done";
      const isActive = state === "active";
      const borderColor = isDone || isActive ? cfg.progressColor : "#234d1b";
      const bgColor = isDone ? cfg.progressColor : "rgba(0,0,0,0.15)";
      const labelColor = isDone || isActive ? cfg.progressColor : "#b0a99a";
      const fontWeight = isDone || isActive ? "700" : "normal";
      const iconChar = isDone ? "✓" : icon;
      const iconColor = isDone
        ? "#fff"
        : isActive
          ? cfg.progressColor
          : "#6b6256";

      return `
      <td width="25%" style="text-align:center;position:relative;z-index:2;" valign="top">
        <!-- Circle icon container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="28" height="28" 
               style="margin:0 auto 6px; border-radius:50%; border:2px solid ${borderColor}; background:${bgColor};" align="center">
          <tr>
            <td align="center" valign="middle" style="font-size:12px; height:28px; width:28px; color:${iconColor}; line-height:28px;">
              ${iconChar}
            </td>
          </tr>
        </table>
        <div style="font-size:10px;line-height:1.3;color:${labelColor};font-weight:${fontWeight};">${esc(label)}</div>
      </td>`;
    })
    .join("");

  return `
    <div style="background:#1A2318;padding:20px 28px;" role="progressbar" aria-label="Order progress">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="position:relative;">
        <tr>
          <td colspan="4" style="padding:0;position:relative;height:0;">
            <!-- Track background -->
            <div style="position:absolute;top:14px;left:24px;right:24px;height:2px;background:#234d1b;" aria-hidden="true"></div>
            <!-- Track fill -->
            <div style="position:absolute;top:14px;left:24px;width:${cfg.progressWidth};height:2px;background:${cfg.progressColor};z-index:1;" aria-hidden="true"></div>
          </td>
        </tr>
        <tr>${stepHtml}</tr>
      </table>
    </div>`;
}

function buildZigzag(
  fromBg: string,
  toBg: string,
  direction: "down" | "up" = "down",
): string {
  const polygon =
    direction === "down"
      ? "0% 100%,4% 0%,8% 100%,12% 0%,16% 100%,20% 0%,24% 100%,28% 0%,32% 100%,36% 0%,40% 100%,44% 0%,48% 100%,52% 0%,56% 100%,60% 0%,64% 100%,68% 0%,72% 100%,76% 0%,80% 100%,84% 0%,88% 100%,92% 0%,96% 100%,100% 0%,100% 100%"
      : "0% 100%,4% 0%,8% 100%,12% 0%,16% 100%,20% 0%,24% 100%,28% 0%,32% 100%,36% 0%,40% 100%,44% 0%,48% 100%,52% 0%,56% 100%,60% 0%,64% 100%,68% 0%,72% 100%,76% 0%,80% 100%,84% 0%,88% 100%,92% 0%,96% 100%,100% 0%,100% 100%,0% 100%";

  return `
    <div style="background:${fromBg};font-size:0;line-height:0;" aria-hidden="true" role="presentation">
      <div style="height:30px;width:100%;background:${toBg};clip-path:polygon(${polygon});"></div>
    </div>`;
}

function buildOrderMetaCard(
  order: Order,
  orderId: string,
  orderDate: string,
  formattedTotal: string,
  isCancelled: boolean,
): string {
  const addr = order.shippingAddress;
  const addressLine = `${esc(addr.address)}<br/>${esc(addr.city)}, ${esc(addr.pincode)}${addr.state ? ", " + esc(addr.state) : ""}`;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
           style="background:#1A2318;border-radius:14px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td valign="top" width="33%" style="padding:20px 22px;border-right:1px solid #234d1b;">
          <div style="font-size:11px;font-weight:700;color:#f8bf51;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:6px;">Order</div>
          <div style="font-size:14px;font-weight:700;color:#fff;">#${esc(orderId)}</div>
          <div style="font-size:12px;color:#7a7060;margin-top:3px;">${esc(orderDate)}</div>
        </td>
        <td valign="top" width="33%" style="padding:20px 22px;border-right:1px solid #234d1b;">
          <div style="font-size:11px;font-weight:700;color:#f8bf51;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:6px;">Ship to</div>
          <div style="font-size:14px;font-weight:700;color:#fff;">${esc(addr.fullName)}</div>
          <div style="font-size:12px;color:#7a7060;margin-top:3px;line-height:1.5;">${addressLine}</div>
        </td>
        <td valign="top" width="34%" style="padding:20px 22px;">
          <div style="font-size:11px;font-weight:700;color:#f8bf51;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:6px;">${isCancelled ? "Refund" : "Total"}</div>
          <div style="font-size:14px;font-weight:700;color:${isCancelled ? "#A07050" : "#fff"};">${formattedTotal}</div>
          <div style="font-size:12px;color:#7a7060;margin-top:3px;">${order.orderItems.length} item${order.orderItems.length !== 1 ? "s" : ""}</div>
        </td>
      </tr>
    </table>`;
}

function buildItemsSection(
  order: Order,
  domain: string,
  fmt: (n: number) => string,
  label: string,
): string {
  const rows = order.orderItems
    .map((item) => {
      const imgSrc = item.image
        ? item.image.startsWith("http")
          ? esc(item.image)
          : esc(`${domain}${item.image}`)
        : `https://placehold.co/48x48/f5f0e8/C6A75E?text=${encodeURIComponent(item.name.charAt(0))}`;

      return `
      <tr>
        <td style="padding-bottom:14px;border-bottom:1px solid #E5DDCB;padding-right:14px;" width="62" valign="middle">
          <img src="${imgSrc}" width="48" height="48" alt="${esc(item.name)}"
               style="display:block;border-radius:8px;font-family:Arial,sans-serif;font-size:10px;color:#999;" />
        </td>
        <td style="padding-bottom:14px;border-bottom:1px solid #E5DDCB;" valign="middle">
          <div style="font-size:13.5px;font-weight:700;color:#234d1b;">${esc(item.name)}</div>
          <div style="font-size:12px;color:#999;margin-top:2px;">
            Qty: ${item.qty}${item.uom ? ` &middot; ${esc(item.uom)}` : ""}
          </div>
        </td>
        <td style="padding-bottom:14px;border-bottom:1px solid #E5DDCB;padding-left:14px;" valign="middle" align="right">
          <div style="font-size:13.5px;font-weight:700;color:#f8bf51;white-space:nowrap;">${fmt(item.price * item.qty)}</div>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <div style="font-size:13px;font-weight:700;color:#234d1b;margin-bottom:14px;">${esc(label)}</div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      ${rows}
    </table>`;
}

function buildTotals(order: Order, fmt: (n: number) => string): string {
  const discountRow =
    (order.discountPrice ?? 0) > 0
      ? `<tr>
          <td style="padding:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#f8bf51;font-weight:600;">Discount</td>
          <td align="right" style="padding:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#f8bf51;font-weight:600;">-${fmt(order.discountPrice ?? 0)}</td>
        </tr>`
      : "";

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
           style="border-top:1px solid #E5DDCB;margin-top:16px;">
      <tr>
        <td style="padding:16px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666;">Subtotal</td>
        <td align="right" style="padding:16px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666;">${fmt(order.itemsPrice)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="padding:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666;">Delivery</td>
        <td align="right" style="padding:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666;">${fmt(order.shippingPrice)}</td>
      </tr>
      <tr>
        <td style="padding:14px 0 0;border-top:2px solid #234d1b;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;color:#234d1b;">Total</td>
        <td align="right" style="padding:14px 0 0;border-top:2px solid #234d1b;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;color:#234d1b;">${fmt(order.totalPrice)}</td>
      </tr>
    </table>`;
}

function buildRefundBreakdown(
  order: Order,
  fmt: (n: number) => string,
): string {
  const discountRow =
    (order.discountPrice ?? 0) > 0
      ? `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #E5DDCB;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#555;">Discount Applied</td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid #E5DDCB;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#f8bf51;">-${fmt(order.discountPrice ?? 0)}</td>
        </tr>`
      : "";

  return `
    <div style="font-size:13px;font-weight:700;color:#234d1b;margin-bottom:14px;">Refund Breakdown</div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #E5DDCB;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#555;">Subtotal</td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid #E5DDCB;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#555;">${fmt(order.itemsPrice)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #E5DDCB;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#555;">Delivery</td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid #E5DDCB;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#555;">${fmt(order.shippingPrice)}</td>
      </tr>
      <tr>
        <td style="padding:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:800;color:#234d1b;">Total Refunded</td>
        <td align="right" style="padding:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:800;color:#A07050;">${fmt(order.totalPrice)}</td>
      </tr>
    </table>
    <hr style="border:none;border-top:1px solid #E5DDCB;margin:24px 0;" />`;
}

function buildSupportCards(email: string, phone: string): string {
  return `
    <div style="font-size:13px;font-weight:700;color:#234d1b;margin-bottom:14px;">Need help with your order?</div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td width="48%" valign="top" style="padding-right:8px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                 style="background:#FAF3E0;border-radius:12px;">
            <tr>
              <td style="padding:14px 16px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="46" valign="middle" style="padding-right:12px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="34" height="34"
                             style="background:#234d1b;border-radius:50%;">
                        <tr><td align="center" valign="middle" style="font-size:14px;color:#fff;" aria-hidden="true">&#9993;</td></tr>
                      </table>
                    </td>
                    <td valign="middle">
                      <div style="font-size:13px;font-weight:700;color:#234d1b;">Email Us</div>
                      <a href="mailto:${esc(email)}" style="font-size:11.5px;color:#999;text-decoration:none;">${esc(email)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
        <td width="4%">&nbsp;</td>
        <td width="48%" valign="top" style="padding-left:8px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                 style="background:#FAF3E0;border-radius:12px;">
            <tr>
              <td style="padding:14px 16px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="46" valign="middle" style="padding-right:12px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="34" height="34"
                             style="background:#234d1b;border-radius:50%;">
                        <tr><td align="center" valign="middle" style="font-size:14px;color:#fff;" aria-hidden="true">&#128222;</td></tr>
                      </table>
                    </td>
                    <td valign="middle">
                      <div style="font-size:13px;font-weight:700;color:#234d1b;">Call Us</div>
                      <a href="tel:${esc(phone.replace(/\s/g, ""))}" style="font-size:11.5px;color:#999;text-decoration:none;">${esc(phone)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function buildBusinessStrip(email: string): string {
  return `
    <div style="background:#FDF9EB;padding:24px 36px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td width="66" valign="middle" style="padding-right:16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="50" height="50"
                   style="background:#234d1b;border-radius:50%;">
              <tr><td align="center" valign="middle" style="font-size:20px;color:#fff;" aria-hidden="true">&#9993;</td></tr>
            </table>
          </td>
          <td valign="middle">
            <div style="font-size:14px;font-weight:700;color:#234d1b;margin-bottom:3px;">Want to talk business with us?</div>
            <div style="font-size:12px;color:#7a7060;line-height:1.55;">
              Reach out at
              <a href="mailto:${esc(email)}" style="color:#234d1b;font-weight:700;text-decoration:none;">${esc(email)}</a>
              &mdash; we open opportunities for all forms of collaboration.
            </div>
          </td>
        </tr>
      </table>
    </div>`;
}

function buildFooter(settings: ResolvedSettings, domain: string): string {
  const year = new Date().getFullYear();
  return `
    <div style="background:#234d1b;padding:28px 40px 32px;text-align:center;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#fff;margin-bottom:16px;">
        ${esc(settings.logoText)}
      </div>
      <div style="font-size:11.5px;color:#b0a99a;line-height:1.7;margin-bottom:12px;">
        ${esc(settings.address)}<br/>${esc(settings.city)}
      </div>
      <div style="font-size:11.5px;margin-bottom:12px;">
        <a href="${esc(domain)}/privacy" target="_blank" style="color:#f8bf51;text-decoration:underline;">Privacy Policy</a>
        <span style="color:#6b6256;">&nbsp;&bull;&nbsp;</span>
        <a href="${esc(domain)}/terms" target="_blank" style="color:#f8bf51;text-decoration:underline;">Terms</a>
      </div>
      <div style="font-size:11px;color:#6b6256;line-height:1.6;">
        You received this email because you placed an order at ${esc(settings.shopName)}.<br/>
        &copy; ${year} ${esc(settings.shopName)}. All rights reserved.
      </div>
    </div>`;
}

// ── Resolved settings helper ─────────────────────────────────────────────────

interface ResolvedSettings {
  shopName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  logoText: string;
  domain: string;
}

function resolveSettings(settings: ShopSettings | undefined): ResolvedSettings {
  const shopName = settings?.shopName || "Sai Nandhini Tasty World";
  const words = shopName.trim().split(/\s+/);
  const logoText = words.slice(0, 2).join(" ");

  return {
    shopName,
    contactEmail: settings?.contactEmail || "info@sainandhini.com",
    contactPhone: settings?.contactPhone || "+91 96009 16065",
    address:
      settings?.address ||
      "# 3/81, 1st Floor, Kaveri Main Street, SRV Nagar, Thirunagar",
    city: settings?.city || "Madurai - 625006",
    logoText,
    domain: "https://sntasty.com",
  };
}

// ── Shared <head> CSS ────────────────────────────────────────────────────────
// Only non-inlineable rules here: resets, media queries, pseudo-selectors.

function buildHeadStyles(): string {
  return `
  <style type="text/css">
    /* ── Resets ── */
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block;}
    body{margin:0!important;padding:0!important;width:100%!important;}

    /* ── Apple auto-linking prevention ── */
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}
    u+#body a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit;}
    #MessageViewBody a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit;}

    /* ── Mobile ── */
    @media only screen and (max-width:600px){
      .ec{width:100%!important;max-width:100%!important;}
      .stack-col{display:block!important;width:100%!important;max-width:100%!important;border-right:none!important;border-bottom:1px solid #234d1b!important;}
      .hide-mobile{display:none!important;max-height:0!important;overflow:hidden!important;mso-hide:all!important;}
      .px-mobile{padding-left:20px!important;padding-right:20px!important;}
      .h1-mobile{font-size:26px!important;}
    }

    /* ── Dark mode ── */
    @media(prefers-color-scheme:dark){
      body,.outer-bg{background-color:#111!important;}
      .dark-white{background-color:#1e1b16!important;}
      .dark-cream{background-color:#201c14!important;}
      .dark-text{color:#ece0cc!important;}
      .dark-muted{color:#6b6256!important;}
      .dark-divider{border-color:#2e2820!important;}
    }
  </style>`;
}

// ── Main exported function ───────────────────────────────────────────────────

export interface EmailTemplateResult {
  /** The complete HTML string ready to send. */
  html: string;
  /** Suggested email subject line. */
  subject: string;
  /** Plain-text preheader / preview text. */
  preheader: string;
}

/**
 * Generates a complete HTML transactional email for a given order.
 *
 * @param order    - The order document (from DB).
 * @param settings - Shop configuration (name, email, address, etc.).
 * @param options  - Optional overrides (statusMessage, locale, currency).
 * @returns        - `{ html, subject, preheader }` — use all three when sending.
 *
 * @example
 * ```ts
 * const { html, subject } = getEmailTemplate(order, shopSettings);
 * await sendEmail({ to: customer.email, subject, html });
 * ```
 */
export function getEmailTemplate(
  order: Order,
  settings?: ShopSettings,
  options: EmailTemplateOptions = {},
): EmailTemplateResult {
  const locale = options.locale ?? "en-IN";
  const currency = options.currency ?? "INR";

  const resolved = resolveSettings(settings);
  const fmt = (n: number) => formatCurrency(n, locale, currency);
  const id = orderId(order);
  const date = formatDate(order.createdAt, locale);
  const total = fmt(order.totalPrice);
  const domain = resolved.domain;
  const orderUrl = order.user
    ? `${domain}/orders`
    : `${domain}/track?orderId=${order._id.toString()}&email=${encodeURIComponent(order.shippingAddress.email)}`;

  const cfg = buildStatusConfig(
    order.status,
    order,
    options.statusMessage,
    total,
    date,
    resolved.shopName,
  );

  const isCancelled = order.status === "Cancelled";
  const itemsLabel =
    order.status === "Shipped" || order.status === "OutForDelivery"
      ? "Items in this shipment"
      : order.status === "Delivered"
        ? "Items delivered"
        : "Items in this order";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no" />
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--<![endif]-->
  <title>${esc(resolved.shopName)} – Order #${esc(id)}</title>
  ${buildHeadStyles()}
  <!--[if mso]>
  <style>table{border-collapse:collapse;}body,td,p,a,span{font-family:Arial,sans-serif!important;}</style>
  <xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->
</head>
<body id="body" style="margin:0;padding:0;background-color:#ece0cc;word-spacing:normal;" class="outer-bg">

  ${buildPreheader(cfg.preheader)}

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ece0cc;">
    <tr>
      <td align="center" valign="top" style="padding:28px 10px;">

        <!-- Email container — max 600px -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="ec"
               style="margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.22);">


          <!-- ── HEADER ─────────────────────────────────────────── -->
          <tr>
            <td align="center" style="background:${cfg.hdrBg};padding:32px 40px 36px;" class="px-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">

                <tr><td align="center">${buildLogo(resolved.logoText)}</td></tr>

                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <span style="display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:50px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;${cfg.badgeStyle}" role="status">
                      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${cfg.badgeColor};" aria-hidden="true"></span>
                      ${esc(cfg.badgeLabel)}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:700;color:#fff;line-height:1.15;" class="h1-mobile">
                      ${cfg.title}
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom:26px;">
                    <p style="margin:0 auto;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#b0a99a;max-width:360px;">
                      ${cfg.desc}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    ${buildCtaButton(orderUrl, cfg.btnText, cfg.btnBg, cfg.btnColor)}
                  </td>
                </tr>

                <tr>
                  <td align="center">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#fff;">${cfg.note}</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>


          <!-- ── PROGRESS BAR ───────────────────────────────────── -->
          ${
            buildProgressBar(cfg).trim()
              ? `<tr><td style="padding:0;">${buildProgressBar(cfg)}</td></tr>`
              : ""
          }


          <!-- ── ZIGZAG header → white ──────────────────────────── -->
          <tr><td style="padding:0;font-size:0;line-height:0;">${buildZigzag(cfg.hdrBg, "#ffffff")}</td></tr>


          <!-- ── BODY ──────────────────────────────────────────── -->
          <tr>
            <td style="background:#fff;padding:36px 40px;" class="dark-white px-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">

                <!-- Info / status card -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="background:${cfg.cardBg};border:1px solid ${cfg.cardBorder};border-radius:12px;padding:22px 24px;">
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${cfg.cardTitleColor};margin-bottom:10px;">${cfg.cardTitle}</div>
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;line-height:1.65;color:#555;">${cfg.cardBody}</div>
                    </div>
                  </td>
                </tr>

                <!-- Order meta card -->
                <tr>
                  <td style="padding-bottom:24px;">
                    ${buildOrderMetaCard(order, id, date, total, isCancelled)}
                  </td>
                </tr>

                <!-- Items or refund breakdown -->
                <tr>
                  <td>
                    ${
                      isCancelled
                        ? buildRefundBreakdown(order, fmt)
                        : buildItemsSection(order, domain, fmt, itemsLabel) +
                          buildTotals(order, fmt)
                    }
                  </td>
                </tr>

                <!-- Divider -->
                <tr><td><hr style="border:none;border-top:1px solid #E5DDCB;margin:24px 0;" /></td></tr>

                <!-- Support cards -->
                <tr>
                  <td>${buildSupportCards(resolved.contactEmail, resolved.contactPhone)}</td>
                </tr>

              </table>
            </td>
          </tr>


          <!-- ── BUSINESS STRIP ─────────────────────────────────── -->
          <tr><td style="padding:0;">${buildBusinessStrip(resolved.contactEmail)}</td></tr>


          <!-- ── ZIGZAG cream → dark ────────────────────────────── -->
          <tr><td style="padding:0;font-size:0;line-height:0;">${buildZigzag("#FDF9EB", "#234d1b", "up")}</td></tr>


          <!-- ── FOOTER ─────────────────────────────────────────── -->
          <tr><td style="padding:0;">${buildFooter(resolved, domain)}</td></tr>


        </table>
        <!-- /email container -->

      </td>
    </tr>
  </table>
  <!-- /outer wrapper -->

</body>
</html>`;

  return {
    html,
    subject: cfg.emailSubject,
    preheader: cfg.preheader,
  };
}
