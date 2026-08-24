# CLAUDE.md — Deneiz Ecommerce

This file defines how code should be written, structured, and named in this codebase.
Follow these rules in every suggestion, generation, and edit.

---

## Project Overview

**Deneiz** is a bilingual (Arabic / English) B2C ecommerce platform for accessories.
It consists of:
- A public **storefront** (product browsing, cart, checkout, reviews)
- A protected **admin panel** (`/admin`) with full back-office capabilities
- A **tRPC API layer** backed by Neon (PostgreSQL) via Drizzle ORM
- **No external CMS** — all content is managed through the custom admin panel

---

## Stack

### Frontend
- Next.js (App Router, Turbopack, React Compiler)
- TypeScript
- Tailwind CSS
- Framer Motion (page transitions, scroll animations)
- Zustand (cart + wishlist global state)
- TanStack Query (server state, all data fetching)
- React Hook Form + Zod (all forms)
- Lucide React (icons)

### Backend / API
- tRPC (primary API layer)
- Next.js Route Handlers (webhooks, file uploads, anything tRPC can't cover cleanly)
- Drizzle ORM
- Neon (PostgreSQL)

### Auth
- Better Auth

### Infra / Tooling
- Vitest (unit tests)
- Husky + lint-staged + commitlint

**Stubbed, not installed.** These have `// PROTOTYPE:` funnel points in `src/lib/`
so enabling one means replacing a single function body — but none of the
packages are in `package.json` yet, and no code path depends on them:
- Sentry (error tracking) — `lib/sentry.ts`
- PostHog (analytics) — `lib/posthog.ts`
- Upstash (rate limiting) — `lib/rate-limit.ts` is an in-process Map
- Resend (transactional email) — `lib/resend.ts`

### Payments
- Cash on delivery only (prototype) — payment field is stubbed with a `// PROTOTYPE:` comment

---

## Colors — Global CSS Only

**All colors are defined exclusively in `app/globals.css` as CSS custom properties.**
Never hardcode hex values, rgb values, or color names anywhere in component files, Tailwind arbitrary values like `bg-[#fff]`, or inline styles.
Always reference colors via `var(--color-name)` in CSS or via Tailwind aliases that map to those variables.

```css
/* app/globals.css */
:root {
  /* Brand */
  --color-primary:         #YOUR_PRIMARY;
  --color-primary-hover:   #YOUR_PRIMARY_HOVER;
  --color-accent:          #YOUR_ACCENT;

  /* Surfaces */
  --color-background:      #FFFFFF;
  --color-surface:         #F7F7F7;
  --color-surface-raised:  #FFFFFF;
  --color-border:          #E5E7EB;

  /* Text */
  --color-text-primary:    #111111;
  --color-text-secondary:  #6B7280;
  --color-text-muted:      #9CA3AF;
  --color-text-inverse:    #FFFFFF;

  /* Semantic */
  --color-success:         #16A34A;
  --color-warning:         #D97706;
  --color-danger:          #DC2626;
  --color-info:            #2563EB;

  /* Admin-specific */
  --color-admin-sidebar:   #111827;
  --color-admin-surface:   #1F2937;
  --color-admin-border:    #374151;
  --color-admin-text:      #F9FAFB;
}

[data-theme="dark"] {
  /* dark mode overrides here */
}
```

**Tailwind v4 is CSS-first — there is no `tailwind.config.ts`.** Tokens are
mapped to utilities with `@theme inline` in the same file that declares them:

```css
/* app/globals.css */
@theme inline {
  --color-primary: var(--color-primary);
  --color-accent: var(--color-accent);
  /* ... etc */
}
```

This way you use `bg-primary`, `text-accent`, etc. in JSX — never raw hex anywhere.
The rule covers color *names* too: `text-white`, `bg-black/50` and friends are
as forbidden as hex. Use `text-on-media` / `bg-scrim` for content over imagery
(those two deliberately do not flip with the theme), and `text-text-inverse`
for text on a themed surface. **ESLint enforces this** — see `eslint.config.mjs`.

---

## Responsive Design Rules

### Core Philosophy

**Design for every viewport, not just breakpoints.**
Do not rely solely on `sm:` / `md:` / `lg:` Tailwind prefixes.
The UI must feel native at any screen width — from 320px to 4K.

### Rules

1. **Use fluid units as the default:**
   - `vw`, `vh`, `dvh`, `svh` for viewport-relative sizing
   - `clamp()` for fluid typography and spacing
   - `%` for widths that should flex within their container
   - `rem` for component-internal spacing (scales with user font preferences)
   - `px` only for borders, shadows, and fixed decorative details (1px, 2px)

2. **Fluid typography — always use `clamp()`:**
   ```css
   /* globals.css */
   --text-xs:   clamp(0.7rem,  1.5vw, 0.75rem);
   --text-sm:   clamp(0.8rem,  2vw,   0.875rem);
   --text-base: clamp(0.9rem,  2.5vw, 1rem);
   --text-lg:   clamp(1rem,    3vw,   1.125rem);
   --text-xl:   clamp(1.1rem,  3.5vw, 1.25rem);
   --text-2xl:  clamp(1.25rem, 4vw,   1.5rem);
   --text-3xl:  clamp(1.5rem,  5vw,   1.875rem);
   --text-4xl:  clamp(1.75rem, 6vw,   2.25rem);
   --text-hero: clamp(2.5rem,  8vw,   5rem);
   ```
   Reference via `font-size: var(--text-hero)` or map to Tailwind `fontSize` config.

3. **Fluid spacing — use `clamp()` for section padding:**
   ```css
   --space-section-y: clamp(3rem, 8vh, 7rem);
   --space-section-x: clamp(1rem, 5vw, 6rem);
   ```

4. **Grid layouts — prefer `auto-fit` / `auto-fill` over fixed breakpoint columns:**
   ```css
   /* ✅ Fluid grid — adapts to any width */
   grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));

   /* ❌ Rigid breakpoint grid */
   @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-4;
   ```

5. **Images — always fluid:**
   ```tsx
   // ✅
   <Image fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />

   // ❌
   <Image width={400} height={400} /> // fixed dimensions
   ```

6. **Heights — prefer `dvh` over `vh` for mobile:**
   ```css
   /* ✅ Accounts for mobile browser chrome */
   min-height: 100dvh;

   /* ❌ Breaks on mobile when address bar is visible */
   min-height: 100vh;
   ```

7. **Breakpoint prefixes (`sm:`, `md:`, `lg:`) are allowed but secondary** — use them only to adjust layout structure (e.g. switching from 1-column to 2-column), never for font sizes or spacing that should scale fluidly.

8. **Touch targets — minimum 44×44px on all interactive elements** (buttons, links, icons). Use `min-h-11 min-w-11` as the floor.

9. **Test at these widths:** 320px, 375px, 430px, 768px, 1024px, 1280px, 1440px, 1920px.

---

## Project Structure

```
src/
  app/
    (storefront)/
      page.tsx                     # Home
      products/
        page.tsx
        [slug]/
          page.tsx
      cart/
        page.tsx
      checkout/
        page.tsx
      account/
        page.tsx
    admin/
      layout.tsx                   # Admin shell (sidebar, topbar)
      page.tsx                     # Dashboard
      products/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
      orders/
        page.tsx
        [id]/
          page.tsx
      inventory/
        page.tsx
      warehouse/
        page.tsx
      reviews/
        page.tsx
      customers/
        page.tsx
      analytics/
        page.tsx
      banners/
        page.tsx
      categories/
        page.tsx
      settings/
        page.tsx
    api/
      trpc/
        [trpc]/
          route.ts
      uploads/
        route.ts
    globals.css                    # ← ALL colors live here, nowhere else
    layout.tsx
    
  components/
    ui/                            # Base primitives (Button, Input, Badge, Modal)
    layout/
      storefront/
        navbar.tsx
        footer.tsx
        mobile-menu.tsx
      admin/
        sidebar.tsx
        topbar.tsx
        breadcrumb.tsx
    storefront/
      product/
        product-card.tsx
        product-grid.tsx
        product-detail.tsx
        product-images.tsx
      cart/
        cart-drawer.tsx
        cart-item.tsx
        cart-summary.tsx
      checkout/
        checkout-form.tsx
        order-summary.tsx
      reviews/
        review-card.tsx
        review-form.tsx
        review-list.tsx
      home/
        hero-section.tsx
        featured-products.tsx
        categories-grid.tsx
        promo-banner.tsx
    admin/
      dashboard/
        stats-cards.tsx
        revenue-chart.tsx
        recent-orders-table.tsx
        low-stock-alert.tsx
      products/
        products-table.tsx
        product-form.tsx
        image-uploader.tsx
      orders/
        orders-table.tsx
        order-detail.tsx
        order-status-badge.tsx
      inventory/
        stock-table.tsx
        stock-adjustment-form.tsx
      warehouse/
        warehouse-map.tsx
        storage-location-form.tsx
      reviews/
        reviews-table.tsx
        review-moderation-actions.tsx
      customers/
        customers-table.tsx
        customer-detail.tsx
      analytics/
        sales-chart.tsx
        traffic-chart.tsx
        top-products-table.tsx
      banners/
        banner-form.tsx
        banners-list.tsx
      categories/
        categories-tree.tsx
        category-form.tsx

  server/
    products/
      products.router.ts
      products.service.ts
      products.db.ts
      products.validators.ts
    orders/
      orders.router.ts
      orders.service.ts
      orders.db.ts
      orders.validators.ts
    inventory/
      inventory.router.ts
      inventory.service.ts
      inventory.db.ts
      inventory.validators.ts
    warehouse/
      warehouse.router.ts
      warehouse.service.ts
      warehouse.db.ts
      warehouse.validators.ts
    reviews/
      reviews.router.ts
      reviews.service.ts
      reviews.db.ts
      reviews.validators.ts
    customers/
      customers.router.ts
      customers.service.ts
      customers.db.ts
      customers.validators.ts
    analytics/
      analytics.router.ts
      analytics.service.ts
      analytics.db.ts
    categories/
      categories.router.ts
      categories.service.ts
      categories.db.ts
      categories.validators.ts
    banners/
      banners.router.ts
      banners.service.ts
      banners.db.ts
      banners.validators.ts
    auth/
      auth.router.ts
      auth.service.ts
      auth.db.ts
    trpc.ts                        # tRPC init, context, root router

  db/
    schema/
      products.ts
      orders.ts
      inventory.ts
      warehouse.ts
      reviews.ts
      customers.ts
      categories.ts
      banners.ts
      users.ts
      # NOTE: the `settings` table lives at the bottom of banners.ts
    index.ts                       # Drizzle client (neon-serverless Pool)
    migrations/                    # generated by `npm run db:generate`

  store/
    cart.store.ts                  # Zustand — cart state
    wishlist.store.ts              # Zustand — wishlist state
    ui.store.ts                    # Zustand — global UI (drawer open, etc.)

  hooks/
    storefront/
      useGetProducts.ts
      useGetProductBySlug.ts
      useGetCategories.ts
      useCreateReview.ts
    admin/
      useGetOrders.ts
      useGetOrderById.ts
      useUpdateOrderStatus.ts
      useGetInventory.ts
      useAdjustStock.ts
      useGetAnalytics.ts
    shared/
      useIsHydrated.ts
      useMediaQuery.ts
      useDebounce.ts
      useBodyScrollLock.ts

  lib/
    trpc-client.ts
    drizzle.ts
    better-auth.ts
    resend.ts
    sentry.ts
    posthog.ts

  types/
    product.ts
    order.ts
    inventory.ts
    warehouse.ts
    review.ts
    customer.ts
    analytics.ts
    shared.ts

  utils/
    format-currency.ts
    format-date.ts
    calculate-discount.ts
    slugify.ts
    parse-filters.ts
```

---

## Admin Panel Modules

### Dashboard
- KPI cards: total revenue, orders today, low stock count, pending reviews
- Revenue chart (last 30 days)
- Recent orders table
- Low stock alerts

### Products (CMS)
- Full CRUD for products
- Image upload (multiple images, drag to reorder)
- Variants (size, color, material)
- Category assignment
- SEO fields (meta title, meta description, slug)
- Draft / Published / Archived status

### Categories (CMS)
- Nested categories (tree structure)
- Slug, image, display order

### Banners (CMS)
- Hero banners and promotional banners
- Active/inactive toggle
- Desktop + mobile image variants
- Link target

### Orders
- Orders table with filters (status, date range, search)
- Order detail view
- Status update (Pending → Processing → Shipped → Delivered → Cancelled)
- COD payment status tracking

### Inventory / Stock
- Per-product stock levels
- Stock adjustment form (add, subtract, reason)
- Low stock threshold configuration
- Stock history log

### Warehouse
- Storage locations (zone, shelf, bin)
- Product-to-location mapping
- Capacity tracking per location

### Reviews Moderation
- All reviews table
- Approve / reject / delete actions
- Flag inappropriate content
- Filter by product or rating

### Customers
- Customer list with search
- Customer detail (orders, reviews, joined date)
- Soft ban / unban

### Analytics
- Sales over time (daily/weekly/monthly)
- Top selling products
- Revenue by category
- Traffic sources (via PostHog)
- Conversion funnel

### Settings
- Store name, contact info
- Currency, language defaults
- Admin user management
- Role assignment (Super Admin, Manager, Staff)

---

## Naming Rules

### Variables & Parameters

Never abbreviate. Names describe exactly what the value is.

```ts
// ❌
const p = product.id;
const fn = (e: Event) => {};

// ✅
const productId = product.id;
const handleAddToCart = (event: Event) => {};
```

### Files

Kebab-case. Name describes what the file does.

```
// ❌
utils.ts / helpers.ts / misc.ts

// ✅
format-currency.ts
calculate-discount.ts
slugify-product-name.ts
```

### Hooks

Verb-first, describes the action:

```ts
useGetProducts()
useGetProductBySlug()
useCreateOrder()
usePatchOrderStatus()
useDeleteReview()
useAdjustStock()
```

### Components

PascalCase, named after what they render:

```
ProductCard.tsx
OrderStatusBadge.tsx
StockAdjustmentForm.tsx
WarehouseLocationPicker.tsx
```

---

## Exports

- **Pages, layouts** → `default export`
- **Components, hooks, utils, types, stores** → `named export`

---

## Data Fetching

tRPC procedures consumed via TanStack Query:

```ts
// hooks/storefront/useGetProducts.ts
export function useGetProducts(filters: ProductFilters) {
  return trpc.products.getAll.useQuery(filters);
}
```

Parallel non-blocking loads:

```ts
Promise.all([
  getProductImages(productId).then(setImages),
  getProductReviews(productId).then(setReviews),
]);
```

Sequential with dependencies:

```ts
const order = await createOrder(orderData);
await sendOrderConfirmationEmail(order.id);
```

---

## State Management

| State type | Tool |
|---|---|
| Server state (products, orders, etc.) | TanStack Query |
| Cart items + totals | Zustand (`cart.store.ts`) |
| Wishlist | Zustand (`wishlist.store.ts`) |
| Global UI (drawer open, modal, etc.) | Zustand (`ui.store.ts`) |
| Local UI state | `useState` / `useReducer` |
| Form state | React Hook Form |

---

## Forms

All forms use React Hook Form + Zod:

```ts
// types/order.ts
export const createOrderSchema = z.object({
  fullName:       z.string().min(2),
  phoneNumber:    z.string().min(10),
  addressLine1:   z.string().min(5),
  city:           z.string().min(2),
  notes:          z.string().optional(),
  paymentMethod:  z.literal("cash_on_delivery"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
```

---

## Auth & Admin Protection

Admin routes under `/admin` are protected via Better Auth middleware.

```ts
// middleware.ts
// Redirect unauthenticated users away from /admin/* to /admin/login
```

Roles: `super_admin`, `manager`, `staff` — enforced at the tRPC procedure level, not just the route level.

---

## Error Handling (tRPC)

Failures travel as a **dictionary key plus params**, never as prose — tRPC
replaces the message of unrecognised throws with "Internal server error" in
production, and an English sentence would be wrong for the Arabic storefront.

- **User-facing errors** → `throw appError("CONFLICT", "stockOnly", { count, name })`
  (`src/server/app-error.ts`). The key rides in `cause`; `errorFormatter`
  publishes it as `data.appError`.
- **Validator messages** → the Zod `message` is the key: `{ message: "tooShort:2" }`
- **Client** → `translateError(error, t)` for toasts,
  `translateFieldMessage(errors.x?.message, t)` for fields
  (`src/lib/translate-error.ts`)
- **Auth/permission errors** → middleware-level
- **Unexpected errors** → `captureException` (the tRPC handler reports every
  `INTERNAL_SERVER_ERROR`)

Every key must exist in **both** locales in `lib/dictionary.ts`; `DeepDictionary`
makes `tsc` fail if one is missing.

---

## Market

Egypt. Currency is `EGP`, numbers format as `ar-EG` with Latin digits forced,
and calendar days are cut in `Africa/Cairo` (`STORE_TIMEZONE`) — not UTC.

---

## i18n / RTL

- Language: Arabic + English
- RTL is set on `<html dir="rtl" lang="ar">` for Arabic — never hack with `text-align: right` in components
- Arabic font: Cairo — English font: Montserrat / Poppins
- All user-visible strings must have Arabic and English variants
- Use a `lang` context (`"ar"` | `"en"`) at the root

---

## TypeScript

- `interface` for object shapes, `type` for unions and computed types
- No `any` — use `unknown` and narrow it
- Zod schemas are the source of truth — infer TS types from them, never duplicate

---

## Comments

Explain **why**, not what:

```ts
// ❌
// Get the product
const currentProduct = await getProductBySlug(slug);

// ✅
// Fetching by slug here instead of ID so the URL stays human-readable
// and shareable — IDs would break if we ever migrate product records
const currentProduct = await getProductBySlug(slug);
```

Use step comments in complex functions:

```ts
async function processOrder(orderData: CreateOrderInput) {
  // 1. Validate stock availability before reserving
  // 2. Reserve stock to prevent overselling
  // 3. Create the order record
  // 4. Send confirmation email (fire-and-forget)
  // 5. Trigger warehouse pick list generation
}
```

---

## General Rules

- No magic numbers — extract as named constants
- No commented-out code in PRs
- Import order: external packages → `@/` aliases → relative imports
- `// PROTOTYPE:` prefix on any intentionally stubbed code
- Env variables accessed through a typed `env.ts` wrapper — never `process.env.X` directly in application code
- No color hex values, rgb, or color names outside of `app/globals.css`
