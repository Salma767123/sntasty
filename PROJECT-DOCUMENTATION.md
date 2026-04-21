# Sai Nandhini Tasty World — Codebase Documentation

> Auto-generated documentation based on codebase analysis.
> Generated on: 2026-04-20

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Project Structure](#3-project-structure)
4. [Architecture](#4-architecture)
5. [Getting Started](#5-getting-started)
6. [Environment Variables](#6-environment-variables)
7. [Database Schema & Models](#7-database-schema--models)
8. [API Reference](#8-api-reference)
9. [Features & Modules](#9-features--modules)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Core Business Logic Flows](#11-core-business-logic-flows)
12. [Patterns & Conventions](#12-patterns--conventions)
13. [Third-Party Integrations](#13-third-party-integrations)
14. [Testing](#14-testing)
15. [Deployment & CI/CD](#15-deployment--cicd)
16. [Known Tech Debt & Observations](#16-known-tech-debt--observations)

---

## 1. Overview

**Sai Nandhini Tasty World** is a full-stack **e-commerce platform** for a South Indian traditional sweets, snacks and pickles brand based in Madurai, India. It is built as a single Next.js App Router application that serves both the public storefront (shop, product pages, cart, checkout, order tracking) and a full-featured admin back office (product master, orders, customers, inventory, coupons, CMS, hero carousel, shipping rates, analytics, global settings).

Key capabilities observed in the code:

- Catalog with **categories / subcategories / UOM variants**, featured flags, SEO metadata per product, image galleries on Cloudinary.
- **Cart + Wishlist** persisted in `localStorage` via React Context.
- **Checkout with Razorpay** online payment, coupon validation, location-based shipping rates, guest-checkout support.
- **Order lifecycle**: Pending → Processing → Shipping → Delivered, with AWB/courier tracking, status-update emails, auto invoice PDF (Puppeteer) and email to customer + admin.
- **Authentication** via [better-auth](https://www.better-auth.com/) with email/password + Google OAuth; custom `role` field distinguishes `customer`, `admin`, `staff`, `user`.
- **Admin dashboard** with sales trend, revenue growth, stock alerts, Mongo aggregation pipelines, inventory stock transactions, Google Places reviews integration and dynamic CMS settings.
- No README or test suite is present in the repo — this document is the primary reference.

Intended audiences: customers (storefront), store administrators/staff (admin portal), and engineers maintaining the platform.

---

## 2. Tech Stack & Dependencies

Defined in [package.json](package.json).

- **Language:** TypeScript 5.9 (with `allowJs`), target ES2017, strict mode on.
- **Framework:** Next.js **16.1.6** — App Router, React 19, server components, route handlers, ISR + in-memory caching, webpack dev server (`next dev --webpack`).
- **Runtime:** Node.js (ESM — `"type": "module"`).
- **Package manager:** npm (lockfile `package-lock.json`).

### Core runtime dependencies

| Group | Packages | Purpose |
|---|---|---|
| Framework | `next`, `react`, `react-dom` | App Router SSR, React 19 server components / Suspense streaming. |
| Database | `mongoose` 9.2, `mongodb` (via better-auth adapter) | ODM for all app models; raw `MongoClient` for better-auth. |
| Auth | `better-auth`, `bcryptjs`, `jsonwebtoken` | better-auth handles email/password + Google OAuth sessions; bcrypt used by the legacy custom register route; `jsonwebtoken` imported but not used in routes examined. |
| Payments | `razorpay` | Creating Razorpay orders on the server, verifying checkout signatures, webhook handling. |
| Payments (unused?) | `stripe` | Listed in deps but no usages found in the codebase. |
| File/Image storage | `cloudinary` | Product images, brand logo/favicon, hero slides, about-us images. |
| Email | `nodemailer`, `@types/nodemailer` | SMTP for order confirmation, admin notification, status-update emails. |
| PDF | `puppeteer`, `puppeteer-core`, `@sparticuz/chromium` | Server-side invoice PDF generation (local puppeteer in dev, serverless chromium in prod). |
| Rich text | `@tiptap/react` + extensions (`starter-kit`, `link`, `underline`, `text-align`, `color`, `text-style`, `list-item`, `pm`) | Admin CMS editor and product description editor. |
| UI | `radix-ui`, `lucide-react`, `shadcn`, `class-variance-authority`, `tailwind-merge`, `clsx`, `tw-animate-css`, `tailwindcss` | Design system / utility classes. `components.json` registers shadcn with style `radix-nova` and an `@aceternity` registry. |
| Animation | `framer-motion` | Page transitions, sidebar animations, hero carousel, admin UI. |
| Charts | `recharts` | Sales trend / revenue charts in the admin dashboard. |
| Notifications | `react-hot-toast` | Toasts for cart, wishlist, checkout, admin actions. |
| Validation | `zod` | All form schemas in `src/lib/validations.ts`. |
| Misc | `shortid` | Short ID generation helper (listed but not referenced in files examined). |

### Dev dependencies

`@types/bcryptjs`, `@types/jsonwebtoken`, `@types/node`, `@types/react`, `@types/react-dom`, `autoprefixer`, `postcss`, `tailwindcss`, `tsx`, `typescript`.

### Build & dev tooling

- **Bundler:** Next.js webpack (explicit `--webpack` in `dev` script).
- **CSS pipeline:** Tailwind CSS 3.4 (`tailwind.config.js`), PostCSS + Autoprefixer, custom CSS variables driven theme defined in [tailwind.config.js](tailwind.config.js) and `src/app/globals.css`.
- **Design tokens:** Primary green `#3d7935` / dark green `#234d1b`, secondary cream `#ece0cc`, gold CTA `#f8bf51`.
- **Fonts:** `Poppins` (sans), `Baloo 2` (serif/cursive), `Geist` loaded via `next/font/google`.
- **Shadcn config:** [components.json](components.json) — `rsc: true`, aliases `@/components`, `@/lib`, `@/components/ui`, `@/lib/utils`, `@/hooks`. Aceternity UI registry declared.
- **TS paths:** `@/*` → `./src/*` in [tsconfig.json](tsconfig.json).
- **Linting/formatting:** No ESLint / Prettier / EditorConfig files found. `next lint` is wired but no custom rules.

---

## 3. Project Structure

```
sai-nandhini/
├── next.config.mjs            ← Next.js config (external packages for puppeteer, image domains, router staleTimes)
├── tailwind.config.js         ← Design tokens (primary/secondary/brown/accent colours + fonts)
├── postcss.config.js          ← Tailwind + autoprefixer
├── tsconfig.json              ← Path alias @/* → ./src/*
├── components.json            ← shadcn config + registries (@aceternity)
├── package.json               ← Scripts: dev / build / start / lint
├── start_db.bat               ← Windows helper that launches local mongod on port 27017 from ./mongo-data
├── .gitignore                 ← Ignores node_modules, .next, mongo-data, /public/uploads/*, env files
├── public/
│   └── uploads/               ← Local uploads (gitignored except .gitkeep)
└── src/
    ├── middleware.ts          ← CORS middleware for /api/* routes (allow-list: sntasty.com, localhost:3000)
    ├── app/                   ← Next.js App Router root
    │   ├── layout.tsx         ← Root layout: fonts, Providers, NavbarDataProvider, SEO metadata from Settings
    │   ├── page.tsx           ← Home page (Hero, Categories, Featured, WhyChoose, About, Reviews, CTA)
    │   ├── loading.tsx / error.tsx / not-found.tsx  ← App-level routing UI
    │   ├── globals.css        ← Tailwind base + CSS vars
    │   ├── about/             ← About Us (public + admin driven via Settings)
    │   ├── admin/             ← Admin portal (layout + 18 sub-routes)
    │   │   ├── layout.tsx             ← Auth gate, sidebar + mobile nav, session-checked via better-auth
    │   │   ├── login/                 ← Admin email/password login
    │   │   ├── dashboard/             ← Stats + sales trend + stock alerts
    │   │   ├── products/              ← Product master (CRUD + variants)
    │   │   ├── categories/ subcategories/ uom/ ← Master data
    │   │   ├── orders/                ← Order list + status updates
    │   │   ├── inventory/             ← Stock transactions
    │   │   ├── customers/             ← Customer list with order stats
    │   │   ├── coupons/               ← Promo code CRUD
    │   │   ├── enquiries/             ← Corporate/event enquiries
    │   │   ├── hero-slides/           ← Hero carousel management
    │   │   ├── legal/                 ← Terms/Privacy/etc pages (uses Tiptap)
    │   │   ├── cms/                   ← Generic CMS editor
    │   │   ├── reviews/               ← Review approval
    │   │   ├── shipping/              ← Shipping rates by state
    │   │   ├── analytics/             ← Sales by category / top products / payment mix
    │   │   └── settings/              ← Global Settings (brand, SEO, SMTP, Razorpay, Google, About)
    │   ├── api/                ← All REST endpoints (Route Handlers)
    │   │   ├── auth/[...all]/route.ts ← better-auth catch-all (emits all /api/auth/* endpoints)
    │   │   ├── auth/register/ + set-password/
    │   │   ├── products/ + [id]/ + reviews/ + [id]/reviews/
    │   │   ├── categories/            ← GET public / POST admin
    │   │   ├── orders/ + [id]/ + [id]/invoice/ + track/
    │   │   ├── payments/razorpay/ + verify/ + webhook/
    │   │   ├── coupons/ + active/ + validate/
    │   │   ├── enquiry/               ← Public corporate enquiry submission
    │   │   ├── find-place/            ← Google Places findplacefromtext proxy
    │   │   ├── page/                  ← Public legal page content by slug
    │   │   ├── reviews/google/ + google/product/
    │   │   ├── seed/ + seed-admin/ + seed-orders/   ← Data bootstrapping endpoints
    │   │   └── admin/*                ← 20 admin-only routes (analytics, stats, settings, orders, …)
    │   ├── shop/                      ← Storefront listing + /shop/[slug] PDP (ProductClient)
    │   ├── checkout/                  ← CheckoutClient: address → coupon → Razorpay
    │   ├── orders/                    ← /orders list + /orders/[id] details + /orders/success
    │   ├── track/                     ← Guest order tracking by order id + email
    │   ├── wishlist/                  ← Wishlist page (from localStorage context)
    │   ├── profile/                   ← Customer profile + change password
    │   ├── login/ + register/         ← Customer auth pages
    │   ├── contact/ + faq/ + offers/ + outlets/ + find-place-id/ + test-reviews/
    │   └── legal/[slug]/ + privacy/ + privacy-policy/ + terms/ + return-and-refund/ + shipping-policy/
    ├── components/                    ← Top-level UI (Navbar, Footer, Hero, FeaturedProducts, CartDrawer, etc.)
    │   ├── admin/                     ← ConfirmationModal, ImageUpload, ProductModal, TiptapEditor
    │   ├── pdp/                       ← ProductGallery, ProductGoogleReviews, RelatedProducts, TrustBadges
    │   └── ui/                        ← comet-card, decay-card (aceternity)
    ├── context/                       ← CartContext, WishlistContext, NavbarDataContext
    ├── lib/
    │   ├── auth.ts / auth-client.ts / auth-types.ts ← better-auth server/client wiring
    │   ├── mongodb.ts                 ← Mongoose connection (cached, global singleton)
    │   ├── mongodb-client.ts          ← Raw MongoClient promise (used by better-auth adapter)
    │   ├── data.ts                    ← Public data fetchers (products/categories/hero/settings) with in-memory cache
    │   ├── admin-data.ts              ← Admin data (dashboard stats, customers w/stats, sales aggregations)
    │   ├── cache.ts                   ← withCache/cached/invalidateCache/revalidatePublicData helpers
    │   ├── cloudinary.ts              ← Cloudinary SDK config + upload/delete helpers
    │   ├── email-service.ts           ← nodemailer order/status/admin emails
    │   ├── email-template.ts          ← HTML template for order emails
    │   ├── encryption.ts              ← AES-256-CBC password/secret encryption (uses BETTER_AUTH_SECRET)
    │   ├── invoice-generator.ts       ← HTML invoice builder (A4)
    │   ├── pdf-generator.ts           ← Puppeteer → PDF (dev: puppeteer; prod: @sparticuz/chromium)
    │   ├── google-reviews.ts          ← Google My Business API helpers
    │   ├── reviewMatcher.ts           ← Keyword-based relevance scoring for Google reviews per product
    │   ├── utils.ts                   ← cn() (clsx + tailwind-merge)
    │   └── validations.ts             ← All zod schemas for forms
    ├── models/                        ← Mongoose models (13 files)
    │   ├── User.ts / Category.ts / SubCategory.ts / UOM.ts
    │   ├── Product.ts / Review.ts / StockTransaction.ts
    │   ├── Order.ts / Coupon.ts / ShippingRate.ts
    │   ├── HeroSlide.ts / Page.ts / Enquiry.ts / Settings.ts
    └── styles/tiptap.css             ← Styles for Tiptap editor output
```

---

## 4. Architecture

### Pattern

Monolithic **Next.js App Router** application, SSR + React Server Components first. Frontend and backend live in the same project — the "backend" is a collection of **Route Handlers** under [src/app/api/](src/app/api/). There is no separate API server.

Three logical layers:

1. **Presentation** — Server Components in `src/app/**/page.tsx` hydrate client components (`*Client.tsx`) passed initial props. Context providers (`CartProvider`, `WishlistProvider`, `NavbarDataProvider`) wrap the app for client state.
2. **HTTP API** — Route Handlers (`route.ts`) accept `Request`, authenticate/authorize, call Mongoose/Mongo directly, return `NextResponse.json(...)`. No controller/service abstraction — business logic is inline in route handlers, with heavier aggregation moved to `lib/admin-data.ts`.
3. **Data / Integration** — Mongoose models + a small set of helper modules in `src/lib/` (auth, cache, cloudinary, email, pdf, encryption, google-reviews).

### Entry points

- **Root layout:** [src/app/layout.tsx](src/app/layout.tsx) — loads fonts, wraps children with `Providers` (Cart/Wishlist/Toaster) and `NavbarDataProvider`. It **does not await** `getNavbarData()`; it passes the promise down and lets React `use()` inside [src/context/NavbarDataContext.tsx](src/context/NavbarDataContext.tsx) suspend the subtree. `generateMetadata()` fetches SEO from the cached `Settings` doc.
- **Home page:** [src/app/page.tsx](src/app/page.tsx) — `export const dynamic = "force-dynamic"`, composes async server components (`HeroSection`, `CategoriesSection`, `ProductsSection`, `StorySection`, `WhyChooseSection`) each wrapped in its own `<Suspense>` boundary for independent streaming.
- **Admin layout:** [src/app/admin/layout.tsx](src/app/admin/layout.tsx) — **client component** that uses `authClient.useSession()` to redirect to `/admin/login` if the session is missing or `role !== "admin"`. Renders the sidebar + mobile nav + content area.
- **Edge/CORS middleware:** [src/middleware.ts](src/middleware.ts) — runs on all non-static routes; for `/api/*` it handles preflight OPTIONS and sets CORS headers from the allow-list `[sntasty.com, www.sntasty.com, localhost:3000]`.

### Request lifecycle (typical public API call)

```
Browser
  ↓ fetch("/api/products?category=sweets")
Next.js edge middleware (middleware.ts)   ← sets CORS headers if origin is allow-listed
  ↓
Route Handler src/app/api/products/route.ts
  ↓ await connectDB() — cached mongoose connection
  ↓ (optional) await auth.api.getSession({ headers })
  ↓ Product.find({...}).populate("subCategory").lean()
  ↓ NextResponse.json(products)
Browser ← JSON response
```

### Request lifecycle (checkout + payment)

See [§11 Core Business Logic Flows](#11-core-business-logic-flows) for the full diagram.

### Layer communication

- Server components import Mongoose models directly (no repository layer). Example: [src/app/shop/[slug]/page.tsx](src/app/shop/[slug]/page.tsx#L10) uses `Product.findOne()` inside a `cache()`-wrapped function.
- Route handlers also import models directly. Admin routes delegate heavier aggregation to `src/lib/admin-data.ts`.
- Client → server communication is via `fetch('/api/...')` calls from client components. There are no RSC actions.
- A lightweight in-memory cache lives in [src/lib/cache.ts](src/lib/cache.ts) and is invalidated by admin mutations via `revalidatePublicData([keys], [paths])`, which additionally calls Next's `revalidatePath("/")`/`revalidatePath("/", "layout")`.

---

## 5. Getting Started

### Prerequisites

- Node.js 18+ (Next.js 16 requires a recent LTS; `@types/node` 25 pinned).
- MongoDB 6/7/8. On Windows a helper [start_db.bat](start_db.bat) launches `C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe` with `--dbpath ./mongo-data --port 27017`.
- A Cloudinary account for image uploads (required for product/brand imagery).
- (Optional) Razorpay test keys, an SMTP account, Google Maps API key with Places enabled, Google Cloud OAuth client (for Google sign-in).

### Install & run (npm scripts from [package.json](package.json))

```bash
npm install
start_db.bat          # Windows: starts local mongod on 27017
npm run dev           # next dev --webpack  → http://localhost:3000
npm run build         # next build
npm run start         # next start (production)
npm run lint          # next lint
```

### Seeding data

Three admin-only seed routes exist (they require an authenticated admin session):

- `GET /api/seed-admin` — creates an admin user + better-auth credential account using env `ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults `admin@sainandhini.com` / `admin123`). **No session is required for this one** — intended for bootstrap; should be locked down in production.
- `GET /api/seed` — creates default Categories, SubCategories, UOMs and Products (admin session required).
- `GET /api/seed-orders` — generates demo orders (admin session required).

### First-run checklist

1. Start MongoDB; set `MONGODB_URI`.
2. Hit `GET /api/seed-admin` to create the admin user.
3. Log in at `/admin/login`.
4. Configure brand + SMTP + Razorpay + Google Places keys in **Admin → Global Settings**.
5. Run `GET /api/seed` to populate sample catalog (optional).
6. Upload hero slides / set shipping rates / create coupons from the admin UI.

---

## 6. Environment Variables

No `.env.example` / `.env.sample` is present in the repo. The following variables are referenced directly in source. Secrets stored in the `Settings` MongoDB document (Razorpay keys, SMTP password, Google API key) are preferred over env vars and encrypted with AES-256-CBC using `BETTER_AUTH_SECRET` as the key material — env vars act as fallbacks.

| Variable | Where used | Required? | Purpose |
|---|---|---|---|
| `MONGODB_URI` | [src/lib/mongodb.ts:3](src/lib/mongodb.ts#L3), [src/lib/mongodb-client.ts:3](src/lib/mongodb-client.ts#L3), [src/lib/auth-types.ts:5](src/lib/auth-types.ts#L5) | **Yes** (no fallback in `mongodb-client.ts`). Defaults to `mongodb://localhost:27017/sai-nandhini` in `mongodb.ts`. | MongoDB connection string. |
| `BETTER_AUTH_SECRET` | [src/lib/encryption.ts:4](src/lib/encryption.ts#L4) | **Yes** (defaults to a placeholder — do not use default in prod). | Session signing for better-auth + master key for AES-encrypting DB secrets. |
| `BETTER_AUTH_URL` | [src/lib/auth.ts:8](src/lib/auth.ts#L8) | Recommended | Base URL better-auth uses for redirects (falls back to `NEXT_PUBLIC_APP_URL`, then `http://localhost:3000`). |
| `NEXT_PUBLIC_APP_URL` | [src/lib/auth.ts:8](src/lib/auth.ts#L8), [src/lib/auth-client.ts:6](src/lib/auth-client.ts#L6) | Recommended | Client-side base URL for the auth client. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | [src/lib/auth.ts:16-17](src/lib/auth.ts#L16) | Optional | Google OAuth for customer sign-in. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | [src/app/api/seed-admin/route.ts:26-27](src/app/api/seed-admin/route.ts#L26) | Used only by seeder | Seed admin credentials; default `admin@sainandhini.com` / `admin123`. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | [src/lib/cloudinary.ts:4-6](src/lib/cloudinary.ts#L4) | **Yes** for image uploads | Cloudinary SDK credentials. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (or `SMTP_PASSWORD`) | [src/lib/email-service.ts:38-42](src/lib/email-service.ts#L38) | Fallback if DB SMTP is empty | Nodemailer transport settings. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | [src/app/api/payments/razorpay/route.ts:61-63](src/app/api/payments/razorpay/route.ts#L61), [verify/route.ts:51](src/app/api/payments/verify/route.ts#L51) | Fallback if DB Razorpay is empty | Razorpay API credentials. |
| `NODE_ENV` | [src/lib/pdf-generator.ts:14](src/lib/pdf-generator.ts#L14), [src/lib/mongodb-client.ts:21](src/lib/mongodb-client.ts#L21) | — | Controls puppeteer vs serverless chromium; client-promise global caching. |

There is also a `razorpayWebhookSecret` stored encrypted in `Settings.payment` (no env fallback).

---

## 7. Database Schema & Models

All models live in [src/models/](src/models/). Mongoose connects through [src/lib/mongodb.ts](src/lib/mongodb.ts) (pooled, `maxPoolSize: 10`, `bufferCommands: false`). better-auth uses its own raw `MongoClient` from [src/lib/mongodb-client.ts](src/lib/mongodb-client.ts), which auto-creates the `user`, `session`, `account`, and `verification` collections.

### User — [src/models/User.ts](src/models/User.ts)
Collection: **`user`** (explicit).
Fields: `name` (req), `email` (req, unique), `password` (req, `select: false`, bcrypt hash), `role` (enum `customer|admin|staff|user`, default `customer`), `phone`, `address.{street,city,pincode,state}`. Timestamps. Indexes: `{role:1, createdAt:-1}`, `{phone:1}`.
Note: Model is deliberately deleted-and-re-registered on each require to avoid stale schema — [User.ts:30-33](src/models/User.ts#L30).

### Product — [src/models/Product.ts](src/models/Product.ts)
Fields: `name` (req), `slug` (req, unique), `description` (req), `price` (req), `category` (req, string), `subCategory` (ref `SubCategory`), `variants: [{ uom, price, stock }]`, `images: [String]`, `stock`, `rating` (default 5), `numReviews`, `isFeatured`, `isActive` (default true), `badge`, `uom` (default `"pcs"`, legacy), `seo.{metaTitle,metaDescription,keywords}`. Indexes: `{isActive, createdAt}`, `{stock}`, `{category}`, `{isFeatured}`.

### Category — [src/models/Category.ts](src/models/Category.ts)
`name` (req, unique), `slug` (req, unique), `description`, `image`, `isActive`, `order`. Index `{isActive, order}`.

### SubCategory — [src/models/SubCategory.ts](src/models/SubCategory.ts)
`name`, `slug`, `parentCategory` (ref `Category`), `description`, `isActive`. Compound unique index `{slug, parentCategory}`.

### UOM — [src/models/UOM.ts](src/models/UOM.ts)
`name` (e.g. "500 gms"), `code` (unique, e.g. "500g"), `isActive`.

### Order — [src/models/Order.ts](src/models/Order.ts)
`user` (ref `User`, optional — guest orders allowed), `orderItems: [{ name, qty, image, price, product (ref Product), uom }]`, `shippingAddress.{fullName, email, phone, address, city, pincode, state}`, `paymentMethod`, `paymentResult.{id,status,update_time,email_address}`, money breakdown `itemsPrice / taxPrice / shippingPrice / discountPrice / discount`, `couponCode`, `totalPrice`, `isPaid`, `paidAt`, `isDelivered`, `deliveredAt`, `status` (enum `Pending|Processing|Shipping|Delivered`, default `Pending`), `awbNumber`, `courierName`, `trackingLink`, `estimatedDeliveryDate`, `shippingNotes`, `invoiceEmailSent`, `invoiceEmailSentAt`. Indexes: `{createdAt:-1}`, `{isPaid, createdAt:-1}`, `{status}`, `{user, createdAt:-1}`, `{shippingAddress.email}`.

### Coupon — [src/models/Coupon.ts](src/models/Coupon.ts)
`code` (unique, upper), `discountType` (`percentage|fixed|free-delivery`), `discountValue` (required unless free-delivery), `minOrderValue`, `maxDiscountAmount`, `expiresAt`, `usageLimit`, `usedCount`, `perUserLimit`, `usedByUsers: [{ userId(ref User), count, lastUsedAt }]`, `isActive`, `displayInCheckout`, `description`, `createdBy` (ref User).

### Review — [src/models/Review.ts](src/models/Review.ts)
`product` (ref), `user` (ref), `rating 1–5`, `comment`, `isApproved` (default false).

### StockTransaction — [src/models/StockTransaction.ts](src/models/StockTransaction.ts)
`product` (ref), `productName`, `variantSku`, `type` (`Purchase|Adjustment|Sale|Return|Opening`), `quantity` (+/-), `previousStock`, `newStock`, `reason`, `reference`, `costPerUnit`, `supplier`, `date`.

### ShippingRate — [src/models/ShippingRate.ts](src/models/ShippingRate.ts)
`location` (enum `Tamil Nadu|Puducherry|Other States`, unique), `rate`, `estimatedDelivery`. Module force-drops any existing compiled model on import to support hot-reload of schema changes.

### HeroSlide — [src/models/HeroSlide.ts](src/models/HeroSlide.ts)
`title`, `titleAccent`, `tag` (default `Bestseller`), `description`, `image` (Cloudinary), `ctaText`, `ctaLink`, `badge1`, `badge2`, `isActive` (indexed), `order`.

### Page — [src/models/Page.ts](src/models/Page.ts)
`slug` (unique, e.g. `terms-of-service`), `title`, `content` (HTML/Markdown), `lastUpdated`.

### Enquiry — [src/models/Enquiry.ts](src/models/Enquiry.ts)
`name`, `email`, `phone`, `type` (enum including `Corporate Booking`, `Event Catering`, `Bulk Order`, `Corporate Gifting`, …), `message`, `status` (`New|In Progress|Completed`).

### Settings — [src/models/Settings.ts](src/models/Settings.ts)
Single document storing site-wide configuration:
- Brand: `shopName`, `contactEmail`, `contactPhone`, `address`, `logo`, `favicon`, `announcement`, `socialMedia.{facebook,instagram,twitter}`.
- Commerce: `taxRates: [{name, rate, isDefault}]`, `minOrderValue`, `lowStockThreshold` (default 10), `manageInventory`, `shippingByWeight`, `allowOrderCancellation`, `allowScheduledOrders`, `isMaintenanceMode`.
- SEO: `seo.{metaTitle, metaDescription, keywords, ogImage}`.
- Secrets (all encrypted with AES-256-CBC before persistence): `payment.{razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret}`, `smtp.{host,port,secure,user,password}`, `googleMyBusiness.{placeId,apiKey,enabled}`.
- CMS blobs: `aboutUs.*`, `ourStory.*`, `whyChooseUs.*` (titles, descriptions, images, bullets, features).

---

## 8. API Reference

All routes are Next.js Route Handlers. CORS for cross-origin callers is handled by [src/middleware.ts](src/middleware.ts). "Admin" below means `session.user.role === "admin"`; "Session" means any authenticated user.

### Authentication

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET/POST | `/api/auth/[...all]` | — | Catch-all for all better-auth endpoints (`/sign-in/email`, `/sign-up/email`, `/sign-out`, `/get-session`, `/callback/google`, etc.). Backed by [src/lib/auth.ts](src/lib/auth.ts) which uses the `mongodbAdapter` + `openAPI()` plugin. |
| POST | `/api/auth/register` | Public | Legacy custom register (bcrypt hash, creates a User doc directly). Body `{name,email,password,phone}`. Returns 201. |
| POST | `/api/auth/set-password` | Session | Sets a password for the current (e.g. Google-linked) user via `auth.api.setPassword`. Requires `password ≥ 8` chars. |

### Catalog (public)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/products?category=&admin=&exclude=&limit=` | Public (admin=true requires no auth but returns inactive/out-of-stock). Active+in-stock filter only applies when `admin!=true` and `Settings.manageInventory` is truthy. | Returns array of products, populated with `subCategory {name, slug}`. |
| POST | `/api/products` | Admin | Multipart/form-data: either a single `file` for ImageUpload (returns `{secure_url}`), or `data`+`newImages[]` to create a product with Cloudinary-uploaded images. Invalidates `PRODUCTS/FEATURED/PRODUCT_SLUG` caches. |
| GET | `/api/products/[id]` | Public | Full product by id. |
| PUT | `/api/products/[id]` | Admin | Update product (multipart or JSON). |
| DELETE | `/api/products/[id]` | Admin | Hard delete. |
| GET | `/api/products/reviews` | Public | Admin/public reviews listing (see file). |
| GET | `/api/products/[id]/reviews` | Public (optional session) | Returns `{reviews, stats{averageRating, totalReviews, ratingBreakdown}, canReview}`. `canReview` is true only if the logged-in user has a Delivered order containing the product and has not yet reviewed it, or is admin. |
| GET | `/api/categories` | Public | All categories. |
| POST | `/api/categories` | Admin | Create category. |

### Orders & payments

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/orders` | Session or guest (user may be null). Admins may set `customerId` to place on behalf of someone else. | Creates order in DB, **but does not email** — email is deferred to after payment verification/webhook. Increments `Coupon.usedCount` and per-user usage when `couponCode` is supplied. Invalidates product caches. |
| GET | `/api/orders` | Session | Current user's orders, populated with product slug/name. |
| GET | `/api/orders/[id]` | Session (owner or admin) | Single order. |
| POST | `/api/orders/track` | Public | Find order by full `_id` (24 hex) or last 6–8 chars of `_id` + matching email. Used by `/track` page. |
| GET | `/api/orders/[id]/invoice?email=` | 4-tier check: admin OR owner OR guest order (no user) OR matching email param | Returns application/pdf (puppeteer). On PDF failure, 302s to the HTML `/orders/[id]/invoice?format=a4` page. |
| POST | `/api/payments/razorpay` | Optional (enforced if order has a user) | Body `{orderId}`. Looks up encrypted Razorpay secret from Settings (falls back to env), instantiates Razorpay SDK, creates an order for `order.totalPrice * 100` paisa and returns `{ ...rzpOrder, key }`. |
| POST | `/api/payments/verify` | Public (verified by HMAC signature) | Body `{razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId}`. HMAC-SHA256 over `order_id\|payment_id` using decrypted key secret. On success marks order `isPaid=true`, `paidAt=now`; if no webhook secret is configured it fires-and-forgets invoice PDF + customer+admin emails (with idempotency flag `invoiceEmailSent`). |
| POST | `/api/payments/webhook` | Public (verified by HMAC of `x-razorpay-signature`) | Handles `payment.captured` and `order.paid` events. Atomic `findOneAndUpdate` on `invoiceEmailSent` to claim email-sending to avoid double-send; rolls back the flag if sending fails. |

### Coupons

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/coupons` (i.e. `/api/coupons/route.ts`) | Public | Returns active + displayInCheckout coupons that are not expired. (Note: file path is `coupons/route.ts` but handler docblock says "GET /api/coupons/active".) |
| GET | `/api/coupons/active` | Public | — see route layout (folder present) |
| POST | `/api/coupons/validate` | Public (user session if available for per-user limit enforcement) | Body `{code, orderAmount}`. Enforces expiry, `usageLimit`, `perUserLimit`, `minOrderValue`, calculates percentage/fixed/free-delivery discount. Returns `{code, type, value, discount, isFreeDelivery, description}`. |

### Public utility

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/enquiry` | Public | Creates an Enquiry document. |
| GET | `/api/find-place?query=&key=` | Public | Proxies Google Places findplacefromtext API (used by `/find-place-id` to discover a `place_id`). |
| GET | `/api/page?slug=` | Public | Returns a CMS Page by slug. |
| GET | `/api/reviews/google` | Public | Google Places Details API (cached 1 hour in a module-level variable). Uses decrypted `Settings.googleMyBusiness.apiKey`. |
| GET | `/api/reviews/google/product?name=...` | Public | Returns Google reviews filtered/ranked by product-name relevance via `reviewMatcher.ts`. |

### Seeding (dangerous — lock down in prod)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/seed-admin` | Public | Creates an admin in `user` + `account` collections directly (sha256 hashed password — bypasses better-auth's password hashing). |
| GET | `/api/seed` | Admin | Seeds categories, subcategories, UOMs and products. |
| GET | `/api/seed-orders` | Admin | Demo orders. |

### Admin API (all require `role === "admin"`)

| Path | Methods | Purpose |
|---|---|---|
| `/api/admin/stats?range=today|week|month` | GET | Calls `getDashboardStats(range)` — see [§11](#11-core-business-logic-flows). |
| `/api/admin/analytics` | GET | Sales by category / top products / payment method mix. |
| `/api/admin/reports/orders` | GET | Orders report export. |
| `/api/admin/settings` | GET / POST / PUT | Reads settings (masks secrets) and persists (re-encrypts secrets, uploads base64 images to Cloudinary, validates Razorpay creds on change via `instance.orders.all({count:1})`). Invalidates SEO/Navbar/Settings caches. |
| `/api/admin/orders` | GET / PUT | List (with optional status filter) / bulk status update. Auto-sets `isDelivered=true, deliveredAt=now` when status → Delivered. |
| `/api/admin/orders/[id]` | PUT | Per-order update (status, `awbNumber`, `courierName`, `trackingLink`, `estimatedDeliveryDate`, `shippingNotes`, manual `isPaid`). Fire-and-forget `sendStatusUpdateEmail()` when status changes. |
| `/api/admin/inventory` | GET / POST | List stock transactions / create a stock adjustment (Purchase/Adjustment/Sale/Return/Opening) — updates variant or main stock with floor at 0. Invalidates product caches. |
| `/api/admin/products/[id]` | … | (router layout shows admin subroute exists; primary product CRUD lives at `/api/products`). |
| `/api/admin/categories` | GET / POST | Admin category ops. |
| `/api/admin/subcategories` | GET / POST | — |
| `/api/admin/uom` + `[id]` | GET / POST / PUT / DELETE | Unit-of-measure master. |
| `/api/admin/coupons` + `[id]` | GET / POST / PUT / DELETE | Supports bulk create when body is an array. |
| `/api/admin/customers` | GET | Customer list with aggregated order stats. |
| `/api/admin/enquiries` | GET / PATCH | List enquiries; PATCH `{id, status}` to update state. |
| `/api/admin/hero-slides` + `[id]` | GET / POST / PUT / DELETE | Hero carousel CRUD. |
| `/api/admin/shipping-rates` + `[id]` + `/migrate` | GET / POST / PUT / DELETE + one-off migration | — |
| `/api/admin/reviews` | GET / PATCH | Approve/delete reviews. |
| `/api/admin/page` | GET / POST / PUT | CMS page CRUD. |
| `/api/admin/reset-demo-data` | POST | Destructive reset. |

---

## 9. Features & Modules

### 9.1 Storefront catalog
- Pages: [src/app/shop/page.tsx](src/app/shop/page.tsx) (category grid + product cards), [src/app/shop/[slug]/page.tsx](src/app/shop/[slug]/page.tsx) (PDP using `React.cache(getProduct)` so `generateMetadata` and `ProductContent` share one Mongo hit), plus `ProductClient` client component for variant selection and add-to-cart.
- Data source: `getProducts()`, `getCategories()`, `getSettings()` from [src/lib/data.ts](src/lib/data.ts) (in-memory cache 60s).
- Components: `FeaturedProducts`, `CategorySection`, `HeroCarousel`, `ComboOffers`, `MadeForYou`, `TrustSection`, `CorporateEnquiry`, `GoogleReviewsCarousel`, PDP components in `src/components/pdp/`.

### 9.2 Cart & Wishlist
Client-side only. [CartContext](src/context/CartContext.tsx) stores `cartItems` in React state synced to `localStorage` key `sai_nandhini_cart`; prevents admins from adding items (toast error). [WishlistContext](src/context/WishlistContext.tsx) uses `sai_nandhini_wishlist`. `CartDrawer` and `/wishlist` page read from these contexts.

### 9.3 Authentication
See [§10 Authentication & Authorization](#10-authentication--authorization).

### 9.4 Checkout & payment
[CheckoutClient](src/app/checkout/CheckoutClient.tsx) — address form (zod `checkoutSchema`), coupon input (`POST /api/coupons/validate`), location-based shipping lookup, Razorpay checkout-JS SDK loaded via `<Script src="https://checkout.razorpay.com/v1/checkout.js" />`. Flow:
1. `POST /api/orders` with items + totals → Mongo order (isPaid=false).
2. `POST /api/payments/razorpay` with `{orderId}` → Razorpay order + key.
3. Client opens Razorpay modal; on success handler calls `POST /api/payments/verify`.
4. On 200, `clearCart()` and redirect to `/orders/success`.

### 9.5 Orders & tracking
- `/orders` — logged-in user's orders (`OrdersListClient`).
- `/orders/[id]` — `OrderDetailsClient` with invoice download link.
- `/orders/success` — confirmation page.
- `/track` — guest tracking by order id fragment + email via `POST /api/orders/track`.
- Invoice rendering: [src/lib/invoice-generator.ts](src/lib/invoice-generator.ts) builds HTML; [src/lib/pdf-generator.ts](src/lib/pdf-generator.ts) converts via Puppeteer; delivered by `/api/orders/[id]/invoice`.

### 9.6 Reviews
Two sources:
- **Internal reviews** stored in `Review` collection, approval-gated. Posted via `/api/products/reviews` (file present). Eligible reviewers must have a `Delivered` order for that product.
- **Google Places reviews** — fetched server-side and cached 1 hour; per-product filtering in [src/lib/reviewMatcher.ts](src/lib/reviewMatcher.ts) scores the place's 5-star reviews by keyword overlap with the product name and category.

### 9.7 Admin dashboard
[src/lib/admin-data.ts](src/lib/admin-data.ts#L164) `getDashboardStats(range)` is the workhorse — runs 11 independent queries in parallel (`Promise.all`), including a `$facet` aggregation that computes `current`, `previous`, `allTime`, `statusDistribution`, and `revenueByCategory` in a single round-trip. IST-midnight normalisation for range boundaries. Returns stats, stockAlerts, salesTrend (chart-ready), recentOrders, topProducts.

### 9.8 Inventory
Tracks every stock change as a `StockTransaction` (Purchase/Adjustment/Sale/Return/Opening) and updates the Product's `stock` or `variants[i].stock` atomically in the same request ([src/app/api/admin/inventory/route.ts](src/app/api/admin/inventory/route.ts)).

### 9.9 Coupons
- Storefront: `/offers` page, `CouponInput` at checkout.
- Types: `percentage` (with `maxDiscountAmount` cap), `fixed`, `free-delivery`.
- Per-user usage tracked in `usedByUsers[]`; global cap via `usageLimit`/`usedCount`.

### 9.10 Corporate/event enquiries
Public `POST /api/enquiry`; admin review in **Admin → Event Enquiries**.

### 9.11 CMS & legal pages
- `Page` model + admin "Legal Pages" and "CMS" sections use a Tiptap rich text editor ([src/components/admin/TiptapEditor.tsx](src/components/admin/TiptapEditor.tsx)) with underline, link, text-align, color, list-item, text-style extensions.
- Public page renders at `/legal/[slug]`, plus hard-routed `/privacy`, `/privacy-policy`, `/terms`, `/return-and-refund`, `/shipping-policy`, `/faq`, `/contact`, `/about`, `/outlets`.

### 9.12 Hero carousel, About, Why-Choose, Our Story
Content stored on the `Settings` document under `aboutUs`, `ourStory`, `whyChooseUs`; hero slides in `HeroSlide` model. Admin has dedicated pages for each. Images auto-uploaded to Cloudinary on save (base64 → secure URL).

### 9.13 Shipping
[ShippingRate.ts](src/models/ShippingRate.ts) holds per-location rates (Tamil Nadu / Puducherry / Other States). Checkout reads rates via `getShippingRatesData()` and applies the matching rate or blocks checkout when no rate exists for a state.

---

## 10. Authentication & Authorization

### Strategy

**[better-auth](https://www.better-auth.com/) v1.4** is the primary auth system, initialised in [src/lib/auth.ts](src/lib/auth.ts):

- `emailAndPassword: { enabled: true, autoSignIn: true }`.
- `socialProviders.google` (requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`).
- `account.accountLinking.enabled = true` with `trustedProviders: ["google"]` — one user can link email + Google.
- Additional user fields: `role` (default `customer`), `phone`, `address`.
- Database adapter: `mongodbAdapter(client.db())` from [src/lib/mongodb-client.ts](src/lib/mongodb-client.ts) — collections `user`, `session`, `account`, `verification`.
- `trustedOrigins`: `sntasty.com`, `www.sntasty.com`, `localhost:3000`.
- `openAPI()` plugin enabled — better-auth's OpenAPI docs are served under `/api/auth/reference` (per plugin convention).
- Client: [authClient](src/lib/auth-client.ts) via `createAuthClient({ baseURL: NEXT_PUBLIC_APP_URL })` with `inferAdditionalFields<typeof auth>()`.

The legacy [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts) writes directly to the `user` Mongoose collection using bcrypt — this runs in parallel with better-auth's own sign-up flow. The customer `/register` page uses `authClient.signUp.email(...)` (better-auth), so the legacy route is only used if something still POSTs to `/api/auth/register`.

### Session retrieval pattern (server-side)

Every protected Route Handler uses the same snippet:

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
if (!session || (session.user as any).role !== "admin") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Client-side the admin layout runs `authClient.useSession()` and `router.replace("/admin/login")` when the role isn't admin ([src/app/admin/layout.tsx:59-65](src/app/admin/layout.tsx#L59)).

### Authorization model

Simple role check — no granular RBAC:

- `admin` — unfettered access to all `/api/admin/*` routes and `/admin/*` UI. Also able to place orders on behalf of other users and bypass the "has-bought" check for leaving reviews.
- `staff` — defined in the enum but not checked anywhere in the code examined.
- `customer` / `user` — standard shoppers; they can see their own orders (`order.user === session.user.id`) and own invoices.
- Guest — can place orders (no `user` ref), pay, and track via order-id + email.

Order ownership enforcement example — [src/app/api/orders/[id]/route.ts:31-39](src/app/api/orders/[id]/route.ts#L31):

```ts
if (order.user.toString() !== session.user.id &&
    (session.user as any).role !== "admin") {
  return 401;
}
```

### Secret/password storage

- Customer passwords: handled by better-auth's scrypt in the `account` collection (or bcrypt in the legacy path).
- Third-party credentials (Razorpay, SMTP, Google API key) are **AES-256-CBC encrypted** before being written to `Settings`, using `BETTER_AUTH_SECRET` hashed to 256 bits as the key. See [src/lib/encryption.ts](src/lib/encryption.ts). They are masked as `"********"` when read back through the admin API.

---

## 11. Core Business Logic Flows

### A. Customer signup & login
```
Customer → /register (RegisterPage)
   ↓ authClient.signUp.email({name,email,password,phone})
   ↓ POST /api/auth/[...all]/sign-up/email  (better-auth)
   ↓ better-auth writes to `user` + `account` collections; autoSignIn=true sets session cookie
Customer ← redirect to /

Customer → /login
   ↓ authClient.signIn.email({email,password})
   ↓ POST /api/auth/[...all]/sign-in/email
   ← session cookie set
```

### B. Admin login
```
Admin → /admin/login  (AdminLoginPage, validated via zod adminLoginSchema)
   ↓ authClient.signIn.email(...)
   ↓ POST /api/auth/[...all]/sign-in/email
AdminLayout `useSession()` checks role === "admin" → render, else router.replace("/admin/login")
```

### C. Order creation, payment, confirmation email (the core path)
```
Customer adds items → CartContext (localStorage)
Customer → /checkout  (CheckoutClient)
   ↓ validate zod checkoutSchema
   ↓ look up shippingRate by state (blocks if no rate)
   ↓ CouponInput → POST /api/coupons/validate { code, orderAmount }
   ↓ returns { discount, isFreeDelivery, type, value }
   ↓ Pay button →
1. POST /api/orders (guest or session)
      • Mongo Order created, isPaid=false, totalPrice=..., couponCode tracked
      • If couponCode: Coupon.usedCount++, per-user usage upserted
      • Cache invalidated: PRODUCTS, FEATURED, PRODUCT_SLUG
2. POST /api/payments/razorpay { orderId }
      • Decrypt Razorpay secret from Settings (fallback env)
      • razorpay.orders.create({amount: totalPrice*100, currency: "INR", notes:{orderId}})
      • Returns {id, amount, currency, key}
3. Browser opens Razorpay checkout modal (razorpay.js → /v1/checkout.js)
4. On success Razorpay JS handler:
     POST /api/payments/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
      • HMAC-SHA256(orderId|paymentId, keySecret) === signature ?
      • Order.isPaid=true, paidAt=now, paymentResult.{id,status:"completed"}
      • If webhookSecret configured: webhook will email.
        Else: fire-and-forget dynamic import → sendOrderConfirmationEmail + sendAdminNewOrderEmail
          generateInvoiceHTML(order) → generatePDFFromHTML(html) → nodemailer attach PDF
          mark order.invoiceEmailSent=true (idempotency)
5. revalidatePath("/orders"); clearCart(); redirect to /orders/success

── Webhook path (if configured in Settings.payment.razorpayWebhookSecret):
Razorpay → POST /api/payments/webhook
   ↓ Verify x-razorpay-signature via HMAC over raw body
   ↓ event.event === "payment.captured" → atomic findOneAndUpdate({invoiceEmailSent:false}→true)
      if claimed: send customer+admin emails; on failure roll back flag
   ↓ event.event === "order.paid" → if !isPaid mark paid
```

### D. Order status update (admin)
```
Admin → /admin/orders (OrdersClient) → select order → change status to "Shipping"
   ↓ PUT /api/admin/orders/[id]  body { status, awbNumber, courierName, trackingLink, ... }
Server:
   ↓ findByIdAndUpdate(id, updateData)
   ↓ if statusChanged → fire-and-forget sendStatusUpdateEmail(order)
     • templates vary by status: Processing / Shipping (with AWB) / Delivered
   ↓ revalidatePath("/orders")
```

### E. Dashboard stats
```
Admin GET /api/admin/stats?range=today|week|month
   ↓ getDashboardStats(range) in src/lib/admin-data.ts
     Promise.all of:
       • Settings.findOne()
       • Product.countDocuments() x3 (total, low, out)
       • User.countDocuments({role ∈ customer|user})
       • Order.aggregate($facet: [current, previous, allTime, statusDistribution, revenueByCategory])
       • Order.aggregate(salesTrend by IST day/hour)
       • Product.find(lowStock/outOfStock).limit(5)
       • Order.find().sort({createdAt:-1}).limit(8).populate("user")
       • Order.aggregate(topProducts sold in range)
   ← single JSON blob consumed by DashboardClient
```

### F. Invoice PDF download
```
Client (OrderDetailsClient) → GET /api/orders/[id]/invoice?email=...
   ↓ Check 4 tiers (admin / owner / guest-order / email-matches)
   ↓ generateInvoiceHTML(order) (A4 HTML)
   ↓ generatePDFFromHTML(html)
       • NODE_ENV=production → puppeteerCore + @sparticuz/chromium
       • else puppeteer headless
   ↓ Response(body=pdfBuffer, content-type=application/pdf, attachment filename=invoice-XXXXXX.pdf)
   (on puppeteer failure → redirect to /orders/[id]/invoice?format=a4 print page)
```

### G. Google reviews
```
Browser → /api/reviews/google
   ↓ return module-level cache if < 1hr old
   ↓ decrypt Settings.googleMyBusiness.apiKey
   ↓ GET https://maps.googleapis.com/maps/api/place/details/json?place_id=...&fields=name,rating,user_ratings_total,reviews&key=...
   ↓ transform reviews to {id, rating, comment, userName, userPhoto, createdAt, source:"google"}
   ↓ refresh cache

PDP → /api/reviews/google/product?name=...
   ↓ same pipeline, then reviewMatcher.ts scores by keyword overlap with product name + category
```

---

## 12. Patterns & Conventions

### Naming
- Server routes: always `route.ts` inside a folder that maps to the URL (App Router).
- Page segments: `page.tsx` (server) pairs with a sibling `XxxClient.tsx` for the interactive part.
- MongoDB: PascalCase model names (e.g. `HeroSlide`), collection defaults to the plural lowercase (`heroslides`); `User` overrides to `collection: "user"` so it shares the table better-auth manages.
- URLs: kebab-case (`/shipping-policy`, `/return-and-refund`), admin subroutes namespaced under `/admin`.
- API: plural resource (`/api/products`), dynamic segment `[id]` or `[slug]` or catch-all `[...all]`.

### Code patterns
- **Server components + Suspense streaming**: [src/app/page.tsx](src/app/page.tsx) has an independent Suspense boundary for each async child so the hero, categories, featured products etc. stream in parallel.
- **Promise-passed-into-client-component pattern**: layout stays synchronous, passes `Promise<NavbarData>` into `NavbarDataProvider`, which calls React `use()` to suspend.
- **React `cache()`** for per-request dedup ([src/app/shop/[slug]/page.tsx:10](src/app/shop/[slug]/page.tsx#L10)).
- **In-memory TTL cache** (`src/lib/cache.ts`) for cross-request caching of catalog/SEO/navbar.
- **`revalidatePublicData([keys], [paths])`** — centralized cache invalidation after admin mutations: clears in-memory store, `revalidatePath(path)` for each, and `revalidatePath("/", "layout")`.
- **Dynamic imports** for heavy server-only deps (puppeteer, invoice/email generators) inside route handlers to keep the route bundle cold-start small and avoid build issues on hosts without Chromium.
- **Lean queries + explicit field selection** — e.g. `PRODUCT_LIST_FIELDS` in `data.ts` prevents shipping SEO blobs to catalog grids.
- **Mongo `$facet`** — single aggregation produces multiple stats in one round-trip on dashboard.
- **Idempotency flag** — `Order.invoiceEmailSent` with atomic `findOneAndUpdate` to prevent double-sending when both verify-endpoint and webhook fire.
- **Mongoose global caching** — both `mongoose.ts` and `mongodb-client.ts` stash instances on `global` to survive HMR in dev.

### Error handling
- No custom error classes. Every Route Handler wraps its body in `try/catch` and returns `NextResponse.json({ error: err.message }, { status })`. Status is usually 500 for unknown, 400 for bad input, 401 for unauthorized, 404 for missing, 415 for bad content type, 502 for upstream SDK errors.
- `console.log/error` liberally used — no structured logger.

### Validation
- All form input validated with zod schemas in [src/lib/validations.ts](src/lib/validations.ts).
- The shared helper `validateForm(schema, data)` returns `{success, data}` or `{success:false, errors: {field: message}}`.
- Some API routes re-validate server-side; others rely on the client form validation plus Mongoose schema validators.

### State management
- **Frontend:** React Context for cart/wishlist/navbar, plus `authClient.useSession()` (better-auth's built-in store). `localStorage` for cart/wishlist persistence.
- **Backend:** Sessions stored server-side by better-auth (`session` collection). In-memory cache per Node instance.

### Styling
- Tailwind with a cream/green/gold palette. The admin portal theme is its own colour palette (`#234d1b`, `#f8bf51`, `#ece0cc`) repeated throughout. Buttons and cards commonly use `rounded-2xl`/`rounded-[2.5rem]` and heavy `font-black uppercase tracking-[0.2em]` typography.

---

## 13. Third-Party Integrations

| Service | What it does | Where it lives | Credentials |
|---|---|---|---|
| **MongoDB Atlas / local** | All persistence | [src/lib/mongodb.ts](src/lib/mongodb.ts), [src/lib/mongodb-client.ts](src/lib/mongodb-client.ts) | `MONGODB_URI` env |
| **better-auth** | Email+password + Google OAuth sessions, account linking | [src/lib/auth.ts](src/lib/auth.ts), [src/lib/auth-client.ts](src/lib/auth-client.ts), `/api/auth/[...all]` | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Cloudinary** | All image uploads (products, brand, hero, about, reviews) | [src/lib/cloudinary.ts](src/lib/cloudinary.ts), used by `/api/products`, `/api/admin/settings`, `/api/admin/hero-slides`, etc. | `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET` env |
| **Razorpay** | Order creation + checkout SDK + HMAC signature verification + webhooks | [src/app/api/payments/razorpay/route.ts](src/app/api/payments/razorpay/route.ts), [verify](src/app/api/payments/verify/route.ts), [webhook](src/app/api/payments/webhook/route.ts), [CheckoutClient](src/app/checkout/CheckoutClient.tsx) loads `https://checkout.razorpay.com/v1/checkout.js` | Encrypted in `Settings.payment.*`; env fallback `RAZORPAY_KEY_ID`/`_SECRET` |
| **Nodemailer / SMTP** | Order confirmation, admin-notification and status-update emails | [src/lib/email-service.ts](src/lib/email-service.ts), [src/lib/email-template.ts](src/lib/email-template.ts) | Encrypted in `Settings.smtp.*`; env fallback `SMTP_HOST/_PORT/_USER/_PASS` |
| **Puppeteer / @sparticuz/chromium** | Server-side PDF rendering for invoices | [src/lib/pdf-generator.ts](src/lib/pdf-generator.ts) — toggles on `NODE_ENV==="production"` | — |
| **Google Places API** | Fetch Google My Business reviews + find place id | [src/app/api/reviews/google/route.ts](src/app/api/reviews/google/route.ts), [find-place/route.ts](src/app/api/find-place/route.ts), helpers in [src/lib/google-reviews.ts](src/lib/google-reviews.ts) + [src/lib/reviewMatcher.ts](src/lib/reviewMatcher.ts) | Encrypted in `Settings.googleMyBusiness.{placeId, apiKey, enabled}` |
| **Tiptap** | Rich text editor in admin CMS + product descriptions | [src/components/admin/TiptapEditor.tsx](src/components/admin/TiptapEditor.tsx), [src/styles/tiptap.css](src/styles/tiptap.css) | — |
| **Stripe** | Listed in dependencies but no import/usage found. | — | — |

Note: The Razorpay API v1 URL `https://mybusiness.googleapis.com/v4/...` helpers in [src/lib/google-reviews.ts](src/lib/google-reviews.ts) are prepared for writing review replies but are not wired to any route handler in this codebase.

---

## 14. Testing

**No testing framework is configured.** There are no `*.test.*` / `*.spec.*` files, no `jest.config`, `vitest.config`, `playwright.config`, or `__tests__` directories in the source tree, and no `test` script in `package.json`. The only testing-related file is [src/app/test-reviews/page.tsx](src/app/test-reviews/page.tsx) which is a **runtime** page used to eyeball the Google Reviews carousel.

---

## 15. Deployment & CI/CD

- No `.github/`, `.gitlab-ci.yml`, `Jenkinsfile`, `vercel.json` or `netlify.toml` are present.
- [next.config.mjs](next.config.mjs) declares `serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "puppeteer"]` — these are not bundled by webpack so they stay in `node_modules` at runtime. The PDF helper at [pdf-generator.ts:15-25](src/lib/pdf-generator.ts#L15) branches on `NODE_ENV==="production"` to use `@sparticuz/chromium` + `puppeteer-core`, which is the canonical Vercel/AWS Lambda setup.
- `next.config.mjs` also allows image loading from any HTTPS host (`remotePatterns: [{ protocol: "https", hostname: "**" }]`) and sets aggressive client router staleTimes (`dynamic: 0, static: 30`) so navigations refetch dynamic data.
- `middleware.ts` hard-codes production origins `https://sntasty.com`, `https://www.sntasty.com` → that is the intended production domain.
- Expected host: Vercel or similar serverless Node platform. (Comments in [verify/route.ts:116](src/app/api/payments/verify/route.ts#L116) mention "no chromium on Hostinger" — which suggests Hostinger has also been evaluated.)

Deployment checklist inferred from the code:
1. Set all env vars from [§6](#6-environment-variables).
2. Point DNS to the deployed domain; keep origins in `middleware.ts` in sync.
3. Configure Razorpay webhook to `POST https://your-domain/api/payments/webhook` with the webhook secret stored encrypted in Settings.
4. Ensure the host can run headless Chromium (Vercel: yes via sparticuz; Hostinger shared: PDF will silently fail — emails still send without attachment).

---

## 16. Known Tech Debt & Observations

- **No tests.** None at all — any refactor is flying blind.
- **No README.** Maintainers rely on tribal knowledge; this doc is now the entry point.
- **Two parallel auth paths.** [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts) writes directly to `user` with bcrypt, while the better-auth `[...all]` route does its own signup with scrypt. If both are ever used simultaneously, a user created by the legacy route may not be loggable via better-auth because there is no matching entry in the `account` collection. The `/register` page already uses `authClient.signUp.email` — consider deleting the legacy route.
- **`/api/seed-admin` is unauthenticated.** It directly inserts an admin into `user` + `account` using sha256 hashing. That hash format differs from better-auth's scrypt — the seeded admin may not be able to sign in via better-auth unless better-auth has been configured to accept sha256 (it isn't). The file comments acknowledge this ("SECURITY: This should be disabled in production or protected") — worth doing.
- **`jsonwebtoken` and `shortid` are in dependencies but unused** in the files examined — dead weight that bloats the bundle.
- **`stripe` in deps** with no code paths. Remove or finish implementing.
- **Encryption fallback key.** [src/lib/encryption.ts:4](src/lib/encryption.ts#L4) falls back to `"default-encryption-key-change-this"` if `BETTER_AUTH_SECRET` is missing — if this ever happens in production, any secret already stored under a proper key becomes undecryptable after a redeploy. Consider hard-failing on missing env.
- **Global singleton hacks.** Both `mongodb.ts` (deletes already-compiled models conditionally) and `ShippingRate.ts` (`if (models.ShippingRate) delete models.ShippingRate;`) imply schema evolution pain — a migration strategy would be healthier.
- **`getShippingRatesData()` sorts by `minAmount`** ([src/lib/admin-data.ts:502](src/lib/admin-data.ts#L502)) but `ShippingRate` has no `minAmount` field — the sort is a silent no-op relic from an older schema.
- **`Settings` migration in two places.** Both [admin/settings/route.ts](src/app/api/admin/settings/route.ts#L21) and [admin-data.ts](src/lib/admin-data.ts#L461) translate a legacy `taxRate` → `taxRates[]` on read. Consider a one-time migration script and deleting the duplicate logic.
- **No request body schema validation on many API routes.** E.g. `/api/orders` trusts the client-supplied `itemsPrice`, `shippingPrice`, `totalPrice`, `discount` — a malicious client can set `totalPrice = 1` and still place an order. Totals should be re-derived server-side.
- **Legacy `uom: String`** on `Product` alongside `variants[].uom` — [Product.ts:25](src/models/Product.ts#L25) notes "Legacy support". Consolidate once all products are on variants.
- **Unused `storeOwner`-style flows.** `staff` role is declared but never referenced for permissions — either implement or remove from the enum.
- **CORS middleware hardcodes `localhost:3000`**, meaning dev on a non-3000 port won't be allow-listed.
- **Module-level review cache** at [src/app/api/reviews/google/route.ts:7-9](src/app/api/reviews/google/route.ts#L7) is per-lambda on serverless — cache hit rate will be low.
- **Fire-and-forget email sending** is not retriable. If both the webhook and the verify path fail, the customer never gets a confirmation email. No background queue.
- **PDP PDF fallback** silently redirects on failure — the user only notices they got an HTML page instead of a PDF.
- **No rate limiting** on `/api/enquiry`, `/api/auth/register`, or `/api/orders/track` — easy abuse vectors.
- **`shippingAddress.state`** is `String` not an enum, but shipping logic and coupon delivery rules rely on a fixed set of states. Consider enumerating.

