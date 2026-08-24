# Deneiz — Code Audit

**Date:** 2026-08-24
**Scope:** full repository — 227 source files, ~13,000 lines (`src/`, `scripts/`, config)
**Method:** every server module, schema, store, hook, layout, page and UI primitive was read in full; findings were cross-checked against the installed dependency source where behaviour depended on it.

**Baseline health:** `tsc --noEmit` passes clean. `vitest run` passes (18 tests, 4 files). No `any`, no `@ts-ignore`, no `process.env` outside `src/env.ts`, no hex/rgb colours outside `globals.css`. The architecture follows `CLAUDE.md` closely — the router/service/db split is consistent, validators are colocated, and comments explain *why*. The findings below are defects inside a well-organised codebase, not a structural problem with it.

---

## Severity index

| # | Severity | Finding | Location |
|---|---|---|---|
| 1 | 🔴 Blocker | `db.transaction()` is unsupported by the neon-http driver — 5 write paths throw | `src/db/index.ts` + 4 call sites |
| 2 | 🔴 Blocker | `/api/uploads` accepts unauthenticated file writes | `src/app/api/uploads/route.ts` |
| 3 | 🟠 High | Category links use `?category=`, filters read `categorySlug` — category browsing is dead | `categories-grid.tsx:38`, `product-detail.tsx:92` |
| 4 | 🟠 High | Dark mode renders white-on-white on every primary surface | `globals.css:42-61` |
| 5 | 🟠 High | Shipping fee has two sources of truth — shown total ≠ charged total | `constants.ts` vs `settings` table |
| 6 | 🟠 High | Business errors thrown as plain `Error` → HTTP 500, message masked in production | all `*.service.ts` |
| 7 | 🟠 High | Working admin credentials hardcoded in a committed script | `scripts/seed.ts:33-34` |
| 8 | 🟠 High | No pagination in any of the five admin tables | `src/components/admin/**` |
| 9 | 🟠 High | Blanket `catch` reports every stock failure as "would go below zero" | `inventory.service.ts:15-18` |
| 10–38 | 🟡 Medium | Correctness, security and efficiency defects — see below | various |
| 39–76 | ⚪ Low | Convention, accessibility, hygiene and documentation drift | various |

---

## 🔴 Blockers

### 1. `db.transaction()` throws at runtime — five write paths are broken

`src/db/index.ts:16` builds the client with the **neon-http** driver:

```ts
const sql = neon(env.databaseUrl);
cachedDb = drizzle(sql, { schema });   // drizzle-orm/neon-http
```

That driver has no transaction support. From `node_modules/drizzle-orm/neon-http/session.js:151`:

```js
async transaction(_transaction, _config = {}) {
  throw new Error("No transactions support in neon-http driver");
}
```

Four call sites invoke it, and they cover the application's most important writes:

| Call site | Feature that breaks |
|---|---|
| `src/server/orders/orders.db.ts:45` | **Checkout** — every order placement |
| `src/server/inventory/inventory.db.ts:19` | **Stock adjustment**, and **order cancellation** (which calls `adjustStock` per line) |
| `src/server/products/products.db.ts:294` | **Product creation** |
| `src/server/products/products.db.ts:322` | **Product update** |

The throw is immediate and unconditional — the callback never runs. This is not a race or an edge case; these features cannot work as written.

**Fix options.** Either switch the driver to `drizzle-orm/neon-serverless` (WebSocket `Pool`, real interactive transactions), or restructure each path to be transaction-free: `db.batch()` for the ordered inserts, and conditional single-statement updates (`WHERE stockQuantity >= n`) for the stock guards, which are already written that way. The first option is a smaller change and preserves the atomicity the comments promise. Note that finding #9 actively hides this error on the inventory path.

### 2. `/api/uploads` writes attacker-controlled files with no authentication

`src/app/api/uploads/route.ts` has no session or role check. `src/proxy.ts` only matches `/admin/:path*`, so nothing gates it. Any anonymous request on the internet can write files into `public/uploads/`, served from the site's own origin.

Compounding issues in the same handler:

- **Line 20** — `file.type` is the client-supplied multipart `Content-Type`. It is trivially spoofed; there is no magic-byte check. Arbitrary bytes can be stored under an image extension.
- **Line 27** — the stored extension is derived from that same spoofable value.
- **Line 23** — the size check runs *after* `await request.formData()` has already buffered the entire body. It does not prevent resource exhaustion, it only rejects afterwards.
- No rate limit, so disk fills unbounded.
- Writing into `public/` also fails silently on serverless hosts (read-only FS). The `PROTOTYPE:` comment flags the storage backend but not the missing auth.

**Fix.** Gate the route on an admin session (`getAuth().api.getSession`), validate magic bytes rather than the declared MIME, enforce a `Content-Length` cap before reading the body, and rate-limit per user.

---

## 🟠 High

### 3. Category navigation silently does nothing

Two places link to a filtered product list:

```tsx
// src/components/storefront/home/categories-grid.tsx:38
href={`/products?category=${category.slug}`}
// src/components/storefront/product/product-detail.tsx:92
href={`/products?category=${product.categorySlug}`}
```

But `productFiltersSchema` (`products.validators.ts:29`) declares the key as **`categorySlug`**, and `parseProductFilters` runs the raw query object through that schema, which strips unknown keys. `serializeProductFilters` correctly emits `categorySlug`.

So the homepage category grid — the primary category browsing path — and the breadcrumb on every product page both land on an **unfiltered** product listing. The filter sidebar works; only the links are wrong. One-word fix in two files.

### 4. Dark mode is unreadable on every primary surface

`globals.css:11-40` defines the light palette including `--color-text-inverse: #ffffff`. The dark block at `:42-61` redefines `--color-primary: #fafafa` but **never redefines `--color-text-inverse`**, which stays `#ffffff`.

Contrast of `#fafafa` on `#ffffff` is ~1.04:1 — effectively invisible. Every `bg-primary text-text-inverse` pairing is affected:

- `ui/button.tsx:17` — the **primary Button**, i.e. Add to cart, Place order, Save, across the whole app
- `home/hero-section.tsx:16` and `home/promo-banner.tsx:18`
- `ui/toast.tsx:44` — the `info` toast
- `product/product-card.tsx:114` — the card's add-to-cart control
- `products/page.tsx:99` and `reviews/review-list.tsx:62` — the active pagination page
- `analytics/sales-chart.tsx:38` — the active granularity tab

**Fix.** Add `--color-text-inverse: #09090b;` (or the background token) to the `[data-theme="dark"]` block.

### 5. Shipping is computed from two different sources

The client computes shipping from compile-time constants:

```ts
// cart/page.tsx:25 and checkout/checkout-form.tsx:36
subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE   // 300 / 25
```

The server computes it from the admin-editable settings row:

```ts
// orders.service.ts:88
subtotal >= settingsRow.freeShippingThreshold ? 0 : settingsRow.shippingFee
```

The moment an admin changes shipping in `/admin/settings`, the customer is shown one total on the checkout button and charged another in the order record. For a cash-on-delivery store this surfaces at the door. A `PROTOTYPE:` comment acknowledges it in `cart/page.tsx:49`; `checkout-form.tsx` carries no such note and is the one that actually places the order.

`settings.getStoreSettings` is already a `publicProcedure` — the correct value is one hook call away.

### 6. Service-layer errors are plain `Error`, so users never see them

`CLAUDE.md` is explicit: *user-facing errors → `throw new TRPCError({ code: "BAD_REQUEST" })`*. In practice every service throws bare `Error`:

- `orders.service.ts:36` — `"This phone number cannot place orders"`
- `orders.service.ts:50, 51, 62` — `"Only 2 left of …"`, `"… is not available"`
- `reviews.service.ts:17` — rate-limit rejection (should be `TOO_MANY_REQUESTS`)
- `categories.service.ts:33, 35, 70, 81`, `banners.service.ts:11`, `warehouse.service.ts:20, 29`, `inventory.service.ts:17`

tRPC maps an unrecognised throw to `INTERNAL_SERVER_ERROR`, and **in production it replaces the message with "Internal server error"**. The UI does `pushToast(error.message || t.errors.generic)` (`checkout-form.tsx:67`), so in dev a developer sees the real reason and in production the customer sees nothing useful. Stock and availability failures — the most common checkout rejections — are invisible.

Secondary: all of these strings are English-only, in a store whose default locale is Arabic.

### 7. Working admin credentials are committed to the repository

```ts
// scripts/seed.ts:33-34
const DEMO_ADMIN_EMAIL = "admin@deneiz.com";
const DEMO_ADMIN_PASSWORD = "deneiz-admin-123";
```

`main()` creates this account through Better Auth and then force-sets `role: "super_admin"` (`:78-81`), and prints the password to stdout (`:83`). Anyone who reads the repo and can reach an environment where `npm run seed` was run has full super-admin access. `.env.local` is untracked, but this file is not.

**Fix.** Read both values from env, refuse to run when `NODE_ENV=production`, and generate a random password when none is supplied.

### 8. Admin tables have no pagination

Every admin list fetches page 1 and stops. The `total` the server returns is discarded.

| Table | Page size |
|---|---|
| `orders-table.tsx:24` | 50, hardcoded |
| `stock-table.tsx:21` | 50, hardcoded |
| `products-table.tsx:27` | server default (20) |
| `customers-table.tsx` | server default (20) |
| `reviews-table.tsx` | server default (20) |

Past those thresholds, records become unreachable through the UI — orders cannot be fulfilled, reviews cannot be moderated, customers cannot be found. The storefront already has a good pagination component (`products/page.tsx:81-118`, with an ellipsis window and RTL-aware arrows) that could be lifted into a shared primitive.

### 9. A catch-all turns every stock error into the same wrong message

```ts
// inventory.service.ts:10-19
try {
  return await adjustStock({ ... });
} catch {
  throw new Error("Stock adjustment rejected — result would go below zero");
}
```

The bare `catch` swallows the original error entirely. A dropped database connection, a bad product id, and — right now — finding #1's `"No transactions support in neon-http driver"` all surface to the operator as a stock-boundary rejection. This is the kind of masking that turns a ten-minute diagnosis into a day.

**Fix.** Inspect the caught error and only rewrite the guard case; re-throw everything else, and report it to Sentry.

---

## 🟡 Medium

### 10. Currency is hardcoded while settings claim it is configurable
`utils/format-currency.ts:16` formats with the constant `CURRENCY_CODE = "EGP"`, but `settings.currency` is an editable admin field (`settings.validators.ts:18-21`). Changing it in the admin panel has no effect on any displayed price.

### 11. Multi-file upload keeps only the last image
```tsx
// image-uploader.tsx:34-44
for (const file of Array.from(files)...) {
  ...
  onChange([...images, { url }]);   // `images` is the render-time prop
}
```
`images` is captured once per render. Each iteration spreads the same stale array, so selecting five files results in one image. Accumulate into a local array and call `onChange` once, or use the functional-update form.

### 12. Banner mobile/desktop image is chosen by language, not viewport
```tsx
// hero-section.tsx:20 and promo-banner.tsx:21
src={locale === "ar" && banner.imageUrlMobile ? banner.imageUrlMobile : banner.imageUrlDesktop}
```
The columns are `imageUrlDesktop` / `imageUrlMobile` and `CLAUDE.md` describes them as "Desktop + mobile image variants". As written, Arabic desktop visitors get the tall mobile crop and English mobile visitors get the wide desktop crop. This wants a `<picture>` element or `sizes`/`srcSet`, not `locale`.

### 13. The hero banner ignores its own link target
`hero-section.tsx:42` always links to `/products`. `banner.linkUrl` is a documented CMS field, is seeded, and is honoured by `promo-banner.tsx:34` — but the hero silently drops it.

### 14. Dashboard "low stock" KPI is capped at 10
```ts
// analytics.service.ts:46-58
listLowStockProducts(threshold)      // signature: (threshold, limit = 10)
lowStockCount: lowStock.length
```
The count is the length of a list limited to 10, so the KPI reads "10" whether there are ten low-stock products or two hundred. `listStockLevels` already computes a proper `lowStockCount` with a `COUNT(*)` — use that.

### 15. The theme cookie is never written, so the SSR branch is dead
`theme-script.tsx:10` reads a `deneiz-theme` **cookie**; `theme-toggle.tsx:33` writes `deneiz-theme` to **localStorage** only. Grepping the whole tree finds no cookie write. The server-side `theme` variable therefore always resolves to `"light"`, and the pre-paint script is doing all the work. Either write the cookie in `toggleTheme`, or drop the cookie read and the `await cookies()` (which opts the layout into dynamic rendering for nothing).

### 16. Saving a product regenerates every variant id
`updateProduct` sets `replaceRelations: true` whenever the payload carries `images` or `variants` (`products.service.ts:79-80`), and the edit page always sends both. `updateFullProduct` then deletes and re-inserts all variants (`products.db.ts:322-346`), issuing fresh UUIDs.

Carts persist `variantId` in localStorage (`cart.store.ts:16`). After any product edit, that id no longer resolves, and checkout's ownership check quietly discards it (`orders.service.ts:54-58`) — the customer is charged the base price with no `priceDelta` and loses the variant label on the order. Diff variants by id and upsert instead of replacing wholesale.

### 17. `ProductForm` skips `zodResolver`, so its error UI is dead
`product-form.tsx:121` calls `useForm` with no resolver. Validation happens afterwards in `buildProductPayload` (`:58-87`), so `formState.errors` is always empty and every `error={errors.X?.message}` prop renders nothing. The only feedback is `window.alert(payload.message)` (`:144`), showing an untranslated raw Zod string like `nameEn: Too small: expected string to have >=2 characters`. This contradicts both the RHF+Zod rule and the bilingual-strings rule.

### 18. The review form's error translation layer never matches
`translateZodMessage` (`review-form.tsx:21-30`) expects canonical keys — `"required"`, `"tooShort:2"` — but `createReviewInputSchema` sets no custom messages, so Zod emits its own English text. Neither branch ever matches; the fallback shows raw English when short and a generic error when long. Either give the schema `{ message: "tooShort:2" }`-style keys, or map on `issue.code` instead of the rendered string.

### 19. Modal steals focus on every parent re-render
`modal.tsx:26-61` depends on `[open, onClose]`. All five call sites pass an inline arrow (`products/page.tsx:128`, `banners-list.tsx:97`, `categories-tree.tsx:228`, `stock-table.tsx:88`, `warehouse-map.tsx:167`), so `onClose` is a new reference each render. Every parent render tears down the effect — calling `previouslyFocused?.focus()` — and re-runs it, calling `panelRef.current?.focus()`. Any state change behind an open modal (a query refetch, a pending mutation) yanks focus out of whatever field the user is typing in. Wrap the handlers in `useCallback`, or depend on a ref for `onClose`.

### 20. Variant stock is enforced only in the browser
`product-detail.tsx:56` gates the quantity picker on `selectedVariant.stockQuantity`, but the server checks only the parent product (`orders.service.ts:60-63`, flagged `PROTOTYPE:`). A crafted request — or a stale tab — can order more of a variant than exists as long as the product total covers it. Since `productVariants.stockQuantity` and `products.stockQuantity` are independent columns with nothing reconciling them (see #38), this drift is not detectable after the fact.

### 21. Guest checkout can overwrite another customer's record
```ts
// customers.db.ts:112-125
.onConflictDoUpdate({ target: customers.phoneNumber,
  set: { fullName: record.fullName, city: record.city ?? undefined, ... } })
```
`phoneNumber` is the unique key. Anyone who enters an existing customer's phone number at checkout rewrites that customer's name and city — no ownership check, no authentication required. The same function also never populates `userId`, so a signed-in shopper's `customers` row is never linked to their account and the admin customer profile can't show it.

Relatedly, `isCustomerBannedByPhone` (`orders.service.ts:35`) is the only ban enforcement on checkout — a banned customer changes one digit and is through. `users.isBanned` is not consulted at all, because `orders.create` is a `publicProcedure`.

### 22. Every mutation invalidates the entire query cache
Roughly twenty hooks do this:
```ts
onSuccess: () => { void queryClient.invalidateQueries(); }   // no key
```
(`useUpdateProduct`, `useDeleteProduct`, `useAdjustStock`, `useUpdateOrderStatus`, `useCreateOrder`, `useModerateReview` ×3, and the rest of `hooks/admin/**`.)

An admin toggling one review's status refetches the product catalogue, the orders list, the customer list, the session, the settings, and the dashboard aggregates — including the `getDashboardStats` query, which runs five separate aggregate passes over `orders`. Scope invalidation to the affected tRPC keys.

Inconsistency in the same group: `useCreateProduct` wraps the call in a local `useInvalidateAll` helper that no other hook uses, and `useCreateReview` invalidates nothing at all.

### 23. Rate limiting is a stub, applied in exactly one place
`lib/rate-limit.ts` is an in-process `Map` that is **never evicted** — every distinct key is retained for the process lifetime, which is an unbounded memory leak on a long-lived server and useless across serverless instances. It is called from `reviews.service.ts:15` and nowhere else: checkout, uploads, and sign-in are unlimited.

The key for guests is `ctx.clientIp`, derived from `x-forwarded-for` (`trpc.ts:46-48`) — a client-controlled header. Anyone can rotate it per request. That line also has a small bug: when the header is present but empty, `""?.trim()` yields `""`, which is not nullish, so `??` does not fall through to `x-real-ip`.

`@upstash/redis` is not in `package.json`, so the documented Upstash path does not exist yet.

### 24. The category depth guard can be bypassed
`assertParentDepthAllowed` (`categories.service.ts:29-37`) checks that the *chosen parent* is itself top-level. It never checks whether the *category being moved* already has children. Give category C a child D, then set C's parent to P: the check passes, and the tree is now P → C → D, three deep, which `categories-tree.tsx` renders only two levels of. Also check `countChildren(id) === 0` before allowing a parent assignment.

### 25. Reviews are unattributed and unverified
`reviews.create` passes only `productId`, `rating`, `authorName`, `title`, `body` to `insertReview` (`reviews.service.ts:21-28`), so `reviews.userId` is **always NULL** even for signed-in users. `authorName` is free text, so anyone can post as anyone. There is no verified-purchase check and no uniqueness constraint, so one visitor can post unlimited reviews for a product (subject only to the stub rate limiter). The `userId` column and its FK exist and are simply never written.

### 26. Product pages are client-rendered — double fetch, no indexable content
`products/[slug]/page.tsx` runs `getPublishedProductBySlug` server-side for `generateMetadata`, then `product-detail-loader.tsx` fetches the identical record again over tRPC from the browser. Two round trips per view, and the initial HTML contains only skeletons — a crawler that does not execute JS sees no product name, price, description, or reviews. For a storefront whose schema carries `metaTitle`/`metaDescription` per product, that is a lot of SEO left on the floor.

`generateMetadata` also uses `nameEn`/`descriptionEn` unconditionally — Arabic metadata is never emitted.

### 27. Both locale dictionaries ship to every client
`lib/dictionary.ts` (818 lines) exports `const dictionaries: Record<Locale, Dictionary> = { en, ar }`. `useLang()` is used by nearly every client component, so both language payloads land in the bundle for every visitor regardless of locale. Split per locale and load one, or move the dictionary to the server boundary.

### 28. No error boundaries, and Sentry is called from exactly one place
There is no `error.tsx`, `global-error.tsx`, or `loading.tsx` anywhere under `src/app/`. A render throw shows Next's default screen. `captureException` (`lib/sentry.ts`) is imported only by `lib/resend.ts` — the tRPC handler (`api/trpc/[trpc]/route.ts`) has no `onError`, and the React Query client has no error callback. `CLAUDE.md` states unexpected errors bubble to Sentry; nothing does. (`@sentry/nextjs` is also absent from `package.json`.)

### 29. No migration history
`drizzle.config.ts:11` points `out` at `./src/db/migrations`, but **the directory does not exist** — the schema has only ever been applied with `db:push`. There is no versioned, reviewable, roll-forward path for a production database. Generate an initial migration before the first deploy.

### 30. A super-admin can lock everyone out
`settings.updateUserRole` (`settings.router.ts:15`) has no guard against demoting yourself, and none against removing the last `super_admin`. One click can leave the store with no one able to manage roles or settings.

### 31. `z.coerce.boolean()` treats the string `"false"` as `true`
`categories.validators.ts:20` and `banners.validators.ts:17` use `z.coerce.boolean()`, which is `Boolean(value)` — every non-empty string, `"false"` included, becomes `true`. `products.validators.ts:24` gets this right with a `boolish` preprocess. The current forms send real booleans so it does not bite today, but any query-string or form-encoded caller silently flips `isActive`. Reuse the `boolish` helper.

### 32. `next/image` will reject admin-entered image URLs
`next.config.ts:6-15` whitelists only `picsum.photos` and `images.unsplash.com`. The image uploader's manual-URL field (`image-uploader.tsx:99-105`) accepts any URL, and banner/category image URLs are free text. Anything from another host throws `Invalid src prop … hostname is not configured` and takes the page down. Either constrain the inputs to `/uploads/…` or widen the config deliberately.

### 33. Order status transitions are unconstrained
`orders.updateStatus` accepts any value from the enum for any order (`orders.router.ts:43-49`). A delivered order can be moved back to pending; a cancelled order can be un-cancelled without re-deducting the stock that `cancelAndRestock` returned. A small transition table would prevent the inventory drift.

`cancelAndRestock` itself (`orders.service.ts:131-151`) is a per-item loop followed by a status write, with no atomicity — a failure halfway leaves stock partly restored and the order still open — and its `if (record.status === "cancelled") return` guard is a check-then-act race that double-restocks under concurrent calls.

### 34. Capacity check loads two full tables per assignment
`assignProductToLocation` (`warehouse.service.ts:18-34`) calls `listStorageLocations()` and `listAssignments()` — every location and every assignment in the warehouse — to validate one row, then filters in JS. It is also a check-then-act race. One `SELECT … WHERE locationId = ?` with a `SUM` would do it.

### 35. `public/uploads` is not gitignored
`.gitignore` has no entry for it, so uploaded product images get committed. Add `/public/uploads`.

### 36. Order numbers: weak randomness, N+1 queries, and a race
`generateOrderNumber` (`orders.service.ts:24-32`) draws four base-36 characters from `Math.random()` and issues a separate `SELECT` per attempt to test uniqueness. `Math.random()` is not cryptographically random, so order numbers are guessable; the check-then-insert window means two concurrent orders can pick the same number and hit a raw unique-constraint error with no friendly message. Use `crypto.randomBytes` and let the unique index arbitrate with a retry on conflict.

### 37. Order line images are never captured
`orders.service.ts:79` hardcodes `imageUrl: null as string | null`. The column, the insert, and the type all exist — the value is simply never sourced from the product. Order history and any future packing slip render without thumbnails.

### 38. Product and variant stock are independent, unreconciled columns
`products.stockQuantity` and `productVariants.stockQuantity` both exist (`db/schema/products.ts:39, 65`). The seed writes both (`seed.ts:174, 184-185`). Checkout decrements only the product (`orders.db.ts:47-54`); the ledger, the low-stock alerts, and the inventory screen all read only the product. Nothing keeps them in sync, so variant stock is decorative and drifts from the first order onward. Pick one as authoritative and derive the other.

---

## ⚪ Low / hygiene

### Conventions (`CLAUDE.md` violations)

39. **19 raw colour utilities** outside `globals.css` — `text-white`, `bg-white/10`, `bg-black/50`, `from-black/60` — in `modal.tsx:69`, `cart-drawer.tsx:50`, `mobile-menu.tsx:67`, `sidebar.tsx:89,90,130,152`, `split-auth-shell.tsx:58,64`, `image-uploader.tsx:78,82,90`, `hero-section.tsx:28,40`, `promo-banner.tsx:30,32`, `categories-grid.tsx:50,51,54`. The rule names colour *names*, not just hex values. `--color-text-inverse` plus a new scrim token cover all of them.
40. **Magic numbers** — `max(48)` in `products.router.ts:63` and `inventory.router.ts:16` (should be `MAX_PAGE_SIZE`); `effectiveStock <= 5` in `product-detail.tsx:120` (should be `settings.lowStockThreshold`, or at minimum the already-defined `LOW_STOCK_DEFAULT_THRESHOLD`); `pageSize: 50` in two admin tables.
41. **Three forms bypass React Hook Form + Zod**, which `CLAUDE.md` mandates: `auth-card.tsx` (manual `useState` + hand-rolled `validate()`), `review-form.tsx` (raw `FormData`), `categories-tree.tsx` `CategoryForm` (manual `useState`). `product-form.tsx` uses RHF without the resolver (#17). Only `checkout-form.tsx` follows the rule.
42. **Inline schema duplication** — `products.router.ts:58-65` and `inventory.router.ts:12-17` define input schemas inline instead of in their `*.validators.ts`, re-declaring literals that already exist as `PRODUCT_STATUSES`.
43. **`window.confirm` / `window.alert`** in `products-table.tsx:30`, `categories-tree.tsx:193`, `banners-list.tsx:81`, `reviews-table.tsx:134`, `product-form.tsx:144` — a `Modal` primitive already exists, and native dialogs are unstyled and untranslatable.
44. **`settings.validators.ts:2` imports from `@/db/schema`**, pulling Drizzle into anything that imports it. The sibling validators are deliberately dependency-free so they can be shared with client code (`products.validators.ts:4-5` says so explicitly).
45. **English-only user-visible string** — `traffic-chart.tsx:12`: `"PostHog integration pending — see lib/posthog.ts"`, rendered in the admin analytics page.
46. **Dead conditional** — `review-form.tsx:123`: `{locale === "ar" ? t.reviewForm.submit : t.reviewForm.submit}` — both branches identical.
47. **`key={index}` on a mutable list** — `product-form.tsx:256`. Removing a middle variant leaves the remaining inputs holding the wrong row's values. The other three `key={index}` uses are static skeletons and are fine.
48. **`useBodyScrollLock.ts` is missing the `"use client"` directive** its siblings all carry.

### Accessibility

49. **Toasts are invisible to screen readers** — `ui/toast.tsx` has no `role="status"` or `aria-live`. There are zero `aria-live` regions in the codebase, and toasts are the app's only feedback channel for cart, checkout, and every admin mutation.
50. **No `prefers-reduced-motion` handling** — ten files use framer-motion (page transitions, reveals, drawers, modals, the auth tab pill) with no `useReducedMotion` anywhere. WCAG 2.3.3.
51. **Input errors are not programmatically associated** — `ui/input.tsx:46-49` renders the message in a sibling `<p>` with `role="alert"` but no `aria-describedby`/`aria-errormessage` link. `ui/select.tsx:39` omits even the `role="alert"`.
52. **Incomplete tab pattern** — `auth-card.tsx:115-137` uses `role="tablist"`/`role="tab"` with no `aria-controls` and no `tabpanel`.

### Robustness

53. **`clientIp` fallthrough bug** — `trpc.ts:47-48`: an empty `x-forwarded-for` yields `""` rather than falling back to `x-real-ip`.
54. **`createTRPCContext` swallows every session error** (`trpc.ts:42-44`) and degrades to guest. Intentional for public queries, but it means a transient DB blip silently signs an admin out into the "no access" card, and nothing is reported.
55. **Non-null assertions on Better Auth results** — `auth-card.tsx:78, 90`: `result.data!.user.name` after only checking `result.error`.
56. **`mapAuthError` matches on English substrings** (`auth-card.tsx:20-25`) and falls through to showing the raw English message when it is ≤80 chars — the same brittleness as #18.
57. **`getSettings()` can return `undefined` typed as `StoreSettings`** — `settings.db.ts:20-21` returns `fallback` with no guard.
58. **`updateProduct` never re-resolves slug uniqueness** — `products.service.ts:69-88` passes a caller-supplied `slug` straight through, so an edit can hit the unique constraint with a raw DB error. Create does resolve it (`:56`).
59. **Unescaped `ILIKE` prefixes** — `findSlugsTaken` (`products.db.ts:284`) and `findCategorySlugMatches` (`categories.db.ts:31`) interpolate the prefix without escaping `%`/`_`. `slugify` strips both today, so this is latent rather than live.
60. **`banners.linkUrl` is unvalidated free text** (`banners.validators.ts:16`) and is rendered into `<Link href>` (`promo-banner.tsx:34`). A `javascript:` value from a staff account becomes stored XSS. Constrain to a relative path or an `http(s)` URL.
61. **`editBanner` only validates the schedule when both dates are in the patch** (`banners.service.ts:44`) — patching `endsAt` alone can place it before the stored `startsAt`.
62. **Inconsistent authorization granularity** — `analytics.getDashboard` is `adminProcedure`, so `staff` sees 30-day revenue, while `analytics.revenueByCategory` is restricted to manager+. Destructive operations (`products.delete`, `categories.delete`, `reviews.delete`, `customers.setBan`) are all plain `adminProcedure`, so `staff` can delete catalogue data. `requireRoles` exists and is used only in `settings.router.ts` and one analytics procedure.
63. **`buildDashboardSnapshot` uses a dynamic `import()`** (`analytics.service.ts:49-51`) with no circular dependency to justify it — `analytics.service → products.db` is one-way.
64. **`getCustomerDetail` drops to raw SQL** for the orders join (`customers.db.ts:84-95`, ``sql`orders o` ``) instead of the typed `orders` table available in the same file's imports.
65. **`verifications` table has no `createdAt`** (`db/schema/users.ts:66-72`), unlike every other Better Auth table. No FK column in the schema carries an index — `orders.userId`, `orders.customerId`, `orderItems.orderId`, `productImages.productId`, `reviews.productId`, `inventoryLogs.productId` are all unindexed, and the admin list queries filter and join on them.

### Money representation

66. All money columns use `numeric(10,2)` with Drizzle's `mode: "number"` (`db/schema/products.ts:20-21` and three sibling files), so exact DB decimals become IEEE-754 doubles the moment they are read. The services compensate with `Math.round(x * 100) / 100` in five places (`orders.service.ts:65-68, 90`, `cart.store.ts:94`, `cart/page.tsx:23`, `checkout-form.tsx:34, 37`), which works for two-decimal EGP but is a pattern that fails quietly as soon as discounts or tax land. Consider `mode: "string"` with a decimal helper, or integer minor units.

### Testing & tooling

67. **Test coverage is four pure utility modules.** `vitest.config.ts` uses `environment: "node"` and `include: ["src/**/*.test.ts"]` — no jsdom and no `.tsx`, so component tests cannot run at all. There is not a single test for a service, router, validator, or `db` module, including checkout pricing and the stock guards.
68. **`lint-staged` runs ESLint only** (`.lintstagedrc.mjs`) — no `tsc --noEmit`, no tests, on commit.
69. **ESLint carries no project rules** (`eslint.config.mjs` is `next/core-web-vitals` + `next/typescript` and nothing else). None of the `CLAUDE.md` conventions — the colour rule, the `process.env` ban, the no-magic-numbers rule — are machine-enforced, which is why #39–#42 accumulated.

### Documentation drift

`CLAUDE.md` describes a project that differs from the one in the repo:

70. Prescribes a `tailwind.config.ts` mapping colour tokens; the project uses Tailwind v4's CSS-first `@theme inline` in `globals.css` and has no config file. The CSS approach is the better one — the doc should say so.
71. Lists Sentry, PostHog, Upstash, and Resend under "Infra / Tooling"; none are in `package.json`. All four are honest `// PROTOTYPE:` stubs, but the stack section reads as fact.
72. Shows `src/db/migrations/` in the tree (does not exist, #29), and `src/db/schema/settings.ts` — the `settings` table actually lives at the bottom of `db/schema/banners.ts:33-47`, despite a full `src/server/settings/` module existing.
73. Describes hooks including `useScrollAnimation`; it exists but is never imported, as is `components/ui/card.tsx` — an entire unused UI primitive.
74. The market is inconsistent: `CURRENCY_CODE = "EGP"` and `ar-EG` formatting, but `orders.validators.ts:14` comments the phone regex as "Saudi/Gulf mobile-friendly" and the seed uses `+966` numbers and Riyadh addresses.

### Dead code

75. Exported and never imported anywhere: `searchCategoryByName` (`categories.db.ts:65`), `isCustomerBanned` (`customers.db.ts:128`), `getRevenueTrend` (`analytics.service.ts:27`), `getProductStock` (`inventory.db.ts:109`), `countOrdersSince` (`orders.db.ts:332`), `localized` (`types/shared.ts:12`), `useScrollAnimation`, `assignmentIdInputSchema` (`warehouse.validators.ts:23`), the whole of `components/ui/card.tsx`, and the constants `DEFAULT_PAGE_SIZE` / `LOW_STOCK_DEFAULT_THRESHOLD`. `calculateDiscountedPrice` is referenced only by its own test. `ProductForm`'s `isEdit` prop is declared and passed by both pages but never destructured or used.

### Latent (production-only)

76. `src/proxy.ts:15` checks for a cookie named exactly `better-auth.session_token`, taken from `SESSION_COOKIE_NAME` (`lib/constants.ts:20`). Better Auth prefixes that name with `__Secure-` whenever the base URL is HTTPS or `NODE_ENV=production` (`node_modules/better-auth/dist/cookies/index.mjs:24-30`). On `http://localhost` the hardcoded name matches, which is why this works in development — **on any HTTPS deployment the proxy will never find the cookie and every signed-in admin will be bounced to `/account?next=/admin`.** Use `getSessionCookie(request)` from `better-auth/cookies`, which handles the prefix and both separator forms.

---

## Suggested order of work

1. **#1** — nothing else matters while checkout, product writes, and stock adjustment throw. Switch to `neon-serverless` or remove the transactions.
2. **#2, #7, #76** — the security and deploy blockers: gate uploads, move the seed credentials to env, fix the proxy cookie before the first HTTPS deploy.
3. **#3, #4, #5** — three small, high-visibility user-facing fixes: one query-param rename, one CSS variable, one settings hook.
4. **#6, #9** — proper `TRPCError`s and a narrowed catch. These make everything after this point diagnosable.
5. **#8** — lift the storefront pagination component into `components/ui` and wire the five admin tables to it.
6. Work the Medium list; fold #69 (ESLint rules) in early so the Low-tier convention drift stops re-accumulating.

---

# Addendum — second pass

**Date:** 2026-08-24
**Method:** re-read with a different lens than the first pass — schema constraints, SQL determinism, request waterfalls, hydration boundaries, locale/timezone correctness, and contrast maths on the actual token values. Findings continue the numbering from #76.

Two claims from the first pass were re-tested and **withdrawn**: persisted-store hydration is in fact guarded by `useIsHydrated` in the navbar, cart page, wishlist page and cart drawer (see #77 for the three places it is missing), and `/api/uploads` does `mkdir(..., { recursive: true })`, so the missing `public/uploads` directory is not a failure mode.

---

## Severity index — addendum

| # | Severity | Finding |
|---|---|---|
| 77 | 🟠 High | Checkout SSRs "your cart is empty" — the one cart surface missing the hydration guard |
| 78 | 🟠 High | Stock is checked per cart line, not per product — two lines of one product oversell |
| 79 | 🟠 High | Order confirmation emails can never send — no email is ever captured or linked |
| 80 | 🟠 High | Sign-out leaves the session in the query cache; the account page keeps rendering the user's data |
| 81 | 🟠 High | Every paginated list has a non-deterministic `ORDER BY` — rows repeat and vanish across pages |
| 82 | 🟠 High | `danger` and `info` fail WCAG AA on dark; `warning` fails on light |
| 83 | 🟠 High | Phone number is the customer primary key but is unnormalised and barely validated |
| 84–103 | 🟡 Medium | Waterfalls, timezone, auth bootstrap, cascade loss, formatting, validation gaps |
| 104–120 | ⚪ Low | Focus rings, headers, dead integrations, schema hygiene |

---

## 🟠 High

### 77. Checkout renders the wrong tree on the server

`checkout-form.tsx:28` reads the persisted cart with no hydration guard:

```tsx
const items = useCartStore((state) => state.items);
...
if (items.length === 0 && !createOrder.isPending) {
  return <div …>{t.checkout.emptyCartWarning}</div>;
}
```

`useIsHydrated` exists precisely for this, and its own docstring says so — *"Persisted Zustand stores hydrate after SSR, so anything derived from them must render only post-mount."* It is correctly applied in `navbar.tsx:24`, `cart/page.tsx:16`, `wishlist/page.tsx:15` and `cart-drawer.tsx:23`. Checkout is the one surface that skips it, and it is the surface where the consequence is worst: the server always renders `items.length === 0`, so **every visitor's checkout HTML is the empty-cart message**, and hydration then swaps in a completely different subtree. React 19 reports the mismatch and re-renders client-side; the user sees "your cart is empty" flash on the page they are trying to pay from.

`product-card.tsx:22` and `product-detail.tsx:36` have the same gap for the wishlist heart (see #91), but they only mismatch an icon fill.

### 78. Stock is validated per line, so one product in two lines oversells

`orders.service.ts:61`:

```ts
if (product.stockQuantity < item.quantity) {
  throw new Error(`Only ${product.stockQuantity} left of "${product.nameEn}"`);
}
```

The check runs inside `input.items.map(...)`, once per line, against the same unchanging `product.stockQuantity`. Cart lines are keyed `productId::variantId` (`cart.store.ts:22`), so **a customer buying two variants of the same product legitimately produces two lines with the same `productId`**. With 3 in stock, a line of 3 and another line of 3 both pass — 6 units accepted against 3.

The database guard in `placeOrderAtomic` (`orders.db.ts:53`, `stockQuantity >= quantity`) does catch it, but per line and sequentially: the first `UPDATE` drives stock to 0, the second matches nothing, and the customer gets `Insufficient stock for product 9f3c…` — a raw UUID, untranslated, thrown as a plain `Error` (so masked to "Internal server error" in production, per #6). And until #1 is fixed there is no transaction, so the first line's decrement and its ledger row are **already committed** when the second throws.

**Fix.** Aggregate quantities by `productId` before the availability check, and validate against the sum.

### 79. Order confirmation email is structurally impossible

```ts
// orders.service.ts:118
void sendOrderConfirmationEmail({
  orderNumber: order.orderNumber,
  recipientEmail: customer.email,   // ← always null
  total: order.total,
});
```

Three independent reasons it can never have a value:

1. `createOrderInputSchema` (`orders.validators.ts:31-40`) has **no email field**. The checkout form collects name, phone, address, city and notes — never an email.
2. `upsertCustomerByPhone` is called with `{ fullName, phoneNumber, city }` (`orders.service.ts:92-96`) — `email` is not passed on insert or update.
3. For a signed-in shopper, `customers.userId` is never written (#21), so the account's email is not reachable from the customer row either.

`sendOrderConfirmationEmail` short-circuits on `!payload.recipientEmail` and logs `skipped (no key or recipient)`. So the "send confirmation email" step that `CLAUDE.md` prescribes in `processOrder` is dead in every code path, and will stay dead after Resend is wired — the missing piece is the input field, not the API key. For a cash-on-delivery store where the order number is the only support handle, that matters (see also #97).

### 80. Signing out does not sign you out of the UI

```ts
// account/page.tsx:51-54
async function handleSignOut() {
  await authClient.signOut();
  pushToast(t.account.signOut, "info");
}
```

No cache invalidation, no redirect, no refresh. The sign-*in* path three lines below deliberately does `queryClient.invalidateQueries().then(() => router.push(nextPath))`. Sign-out does neither, and the query client is configured with `staleTime: 30_000` and `refetchOnWindowFocus: false` (`app-providers.tsx:22-24`), so `auth.me` stays cached: after clicking sign out the page continues to render the user's **name, email address and full order history** until something else forces a refetch. The cookie is gone, so the data is stale rather than live — but on a shared device the difference is invisible to the person looking at the screen.

Mirror the sign-in handler: invalidate, then push.

### 81. Paginated lists have no stable sort order

Every list query pages with `LIMIT`/`OFFSET` over an `ORDER BY` that is not unique:

| Query | Order key | Ties are common because |
|---|---|---|
| `products.db.ts:111` | `price`, `createdAt`, or a rating subquery | `top_rated` returns `0` for every unreviewed product |
| `orders.db.ts:146,207` | `createdAt` | bulk seeds and concurrent checkouts |
| `inventory.db.ts:72` | `stockQuantity` | most products sit at the same round number |
| `reviews.db.ts`, `customers.db.ts`, `categories.db.ts` | same pattern | — |

Postgres gives no guarantee of order among tied rows, and is free to return them differently for different `OFFSET`s. In practice a paged catalogue sorted by price **shows some products twice and omits others entirely**, and the effect is worst for `top_rated`, where a store with few reviews has every product tied at zero.

**Fix.** Append `products.id` (or the table's primary key) as a final `ORDER BY` term everywhere. One line per query.

### 82. Semantic colours fail contrast — and not only in dark mode

The `[data-theme="dark"]` block (`globals.css:42-61`) redefines the brand, surface and text tokens but leaves `--color-success`, `--color-warning`, `--color-danger` and `--color-info` at their light-mode values. Measured against the actual token values:

| Token | On dark `#09090b` | On light `#ffffff` |
|---|---|---|
| `--color-danger` `#dc2626` | **4.1 : 1** ✗ | 4.8 : 1 ✓ |
| `--color-info` `#2563eb` | **3.9 : 1** ✗ | 5.2 : 1 ✓ |
| `--color-warning` `#d97706` | 6.6 : 1 ✓ | **3.0 : 1** ✗ |
| `--color-success` `#16a34a` | 6.0 : 1 ✓ | 5.4 : 1 ✓ |

WCAG AA requires 4.5:1 for text below 18pt. All four are used almost exclusively on small text — `text-xs text-danger` for every form validation message (`input.tsx:47`), `text-xs text-warning` for the low-stock label (`product-card.tsx:123`), `text-xs text-danger` for the sold-out label. So **the low-stock warning fails contrast in the default light theme**, and validation errors fail in dark.

This is the same root cause as #4 (an incomplete dark block) but a different set of tokens and, for `warning`, a light-mode failure that #4 did not cover.

### 83. Phone number is the customer identity key, unnormalised

```ts
// orders.validators.ts:15
const phonePattern = /^[+\d][\d\s-]{7,14}$/;
```

`customers.phoneNumber` is `.notNull().unique()` and is the conflict target for the guest upsert (`customers.db.ts:112`). Two problems compound:

- **The pattern barely validates.** After the first character it accepts any mix of digits, spaces and hyphens — `+--------` matches. Junk values become permanent unique customer rows.
- **Nothing normalises.** `+201234567890`, `+20 123 456 7890` and `0201234567890` are three distinct customers for one person. The admin customer list shows duplicates, order history fragments, and — the sharp edge — `isCustomerBannedByPhone` (`orders.service.ts:35`) is the only ban enforcement on checkout, so **a banned customer defeats it by typing one space**.

The comment on the pattern also says "Saudi/Gulf mobile-friendly" in a store that formats every price as `EGP` in `ar-EG` (#74).

**Fix.** Normalise to E.164 before the uniqueness check and before every ban lookup, and tighten the pattern to require a plausible digit count.

---

## 🟡 Medium

### 84. Independent queries are awaited serially, on a driver where each one is an HTTPS request

`neon-http` sends every statement as its own HTTP request, so a serial `await` chain is a chain of network round trips. The code serialises constantly:

- **Every paginated list** runs its rows query, then its `count(*)` query — 10 occurrences across `products.db.ts`, `orders.db.ts`, `inventory.db.ts`, `reviews.db.ts`, `customers.db.ts`, `categories.db.ts`. They share a `where` and are independent.
- **`getDashboardStats` (`orders.db.ts:220-265`)** awaits `revenue30d`, then `ordersToday`, then `pendingReviews`, and only then `Promise.all`s the last two. Five round trips where two would do — and the comment above it claims *"one pass over each aggregate keeps this cheap."*
- **`listStockLevels` (`inventory.db.ts:60-84`)** runs three sequential queries.
- **`placeOrder` (`orders.service.ts:34-98`)** is the worst case: ban check → products → variants → settings → customer upsert → order-number uniqueness check, six sequential round trips **before the write begins**. The first four are mutually independent.

`CLAUDE.md`'s own Data Fetching section prescribes `Promise.all` for exactly this and gives checkout as the sequential-dependency counter-example. The dependency is real only for the last two steps.

### 85. All date logic runs in UTC for an Egypt-facing store

- `getDashboardStats` counts today's orders with `date_trunc('day', now())` (`orders.db.ts:236`) — the database's day, i.e. UTC on Neon.
- `getSalesSeries` buckets the revenue chart with `date_trunc(bucket, "createdAt")` (`orders.db.ts:283`) — same.
- `generateOrderNumber` builds the `DNZ-YYYYMMDD-` prefix from `new Date().toISOString()` (`orders.service.ts:25`) — the *server's* UTC date.

Cairo is UTC+2 (UTC+3 in summer). Every order placed between midnight and 02:00/03:00 local is counted on the previous day in the dashboard KPI, plotted in the previous day's chart bucket, and **stamped with yesterday's date in its order number** — the number the support agent reads back to the customer. Late-evening ordering is exactly when a jewellery storefront is busy.

**Fix.** Store the store timezone in `settings` and use `date_trunc('day', "createdAt" AT TIME ZONE 'Africa/Cairo')`; derive the order-number date the same way.

### 86. `ADMIN_EMAIL` is a standing self-service super-admin registration

```ts
// better-auth.ts:36-44
const bootstrapEmail = env.adminBootstrapEmail?.toLowerCase();
if (bootstrapEmail && user.email.toLowerCase() === bootstrapEmail) {
  return { data: { ...user, role: "super_admin" } };
}
```

The hook has no "only when no super_admin exists yet" condition, and `requireEmailVerification` is `false` (`:18`). So for as long as `ADMIN_EMAIL` remains set, **anyone who registers with that address becomes super_admin without proving they own it**. The `env.ts` comment says "Clear it once the team is provisioned" and the code comment says "no SQL handouts" — but nothing enforces the clearing, and the value is likely to sit in the deployment's environment indefinitely.

The exposure is bounded by the address being unguessable and already taken in a healthy deployment. It stops being bounded if the admin account is ever deleted, or if the email is a predictable `admin@`/`info@` on the store's own domain.

**Fix.** Gate the hook on `countUsersWithRole("super_admin") === 0`, and require email verification for privileged roles.

### 87. Search patterns don't escape `%` and `_`

```ts
ilike(products.nameEn, `%${filters.search}%`)
```

`products.db.ts:80,81,214`, `orders.db.ts:123-125`, `inventory.db.ts:55`, and the customer and review searches all interpolate raw user input into an `ILIKE` pattern. It is parameterised, so this is not injection — but `%` and `_` are wildcards. A storefront search for `%` matches every product; `_` matches any single character. Order search accepts the same, over `orderNumber`, `fullName` and `phoneNumber`.

Finding #59 flagged the same bug on slug prefixes and called it latent because `slugify` strips both characters. **These are live** — they read straight from a text input.

### 88. Deleting a product destroys the audit trail the schema promises

`deleteProductById` (`products.db.ts:350`) is a hard `DELETE`. The FKs cascade:

- `inventoryLogs.productId` → `onDelete: "cascade"`, and that table's own comment reads *"Append-only stock ledger … so the current product.stockQuantity is always auditable."* Deleting one product erases its entire stock history.
- `reviews.productId` → cascade. Moderation decisions vanish.
- `productImages`, `productVariants`, `productLocations` → cascade, which is correct.
- `orderItems.productId` → `set null`, which is correct — the name and price snapshots preserve order history.

Meanwhile `products.status` has an `archived` value, described in `CLAUDE.md` as one of the three lifecycle states, and `listLowStockProducts` already filters on `["published", "draft"]`. Archiving is the intended soft-delete and the admin table wires the destructive one instead.

Knock-on: `getRevenueByCategory` (`orders.db.ts:326`) `innerJoin`s `products` on `orderItems.productId`, so once a product is deleted its historical revenue silently disappears from the category report too.

### 89. The place-order button prints Arabic-Indic digits and no currency

```tsx
// checkout-form.tsx:143
{t.checkout.placeOrder} — {total.toLocaleString(locale)}
```

`format-currency.ts` exists, is used for every other price on the page, and carries a deliberate comment: *"Latin digits are forced for Arabic so prices stay scannable in a right-to-left layout without mixing numeral systems."* This one call bypasses it. `(325).toLocaleString("ar")` returns `٣٢٥` — so the single most important button in the checkout shows a different numeral system from the order summary beside it, and no currency symbol at all.

Use `formatCurrency(total, locale)`.

### 90. Raw Zod English renders on the Arabic checkout form

`checkout-form.tsx` is the one form that wires `zodResolver` correctly (#41 credits it), which means its `error={errors.fullName?.message}` props actually display. But `createOrderInputSchema` sets no custom messages, so what displays is Zod's own output — `Too small: expected string to have >=2 characters`, `Invalid string: must match pattern /^[+\d][\d\s-]{7,14}$/` — in English, on a store whose default locale is Arabic.

Findings #17 and #18 covered forms where the error UI is *dead*. This is the live one: the messages render, and they are the wrong language and the wrong register.

### 91. Wishlist state mismatches on hydration

`product-card.tsx:22` and `product-detail.tsx:36` read the persisted wishlist store without `useIsHydrated`. The server renders every heart unfilled; the client renders the true state. Smaller than #77 — it mismatches an icon fill on a page that is otherwise identical — but it is the same omission, and product cards appear in a grid, so React reconciles the mismatch across every tile.

### 92. `<button>` nested inside `<Link>` in every product card

`product-card.tsx:49-89`: the wishlist toggle is a `<button>` inside the `<a>` that wraps the product image. Interactive elements may not nest — the HTML parser is permitted to relocate the inner control, and keyboard activation is ambiguous (the `onClick` calls `preventDefault`, which handles the pointer case, but Enter on the inner button navigates the anchor in some engines).

Two further issues in the same block:

- The toggle's `aria-label` is the constant `t.wishlist.title`, with no `aria-pressed` — a screen-reader user cannot tell whether the item is in the wishlist or what the button will do.
- When `coverImageUrl` is null the anchor's only child is that button, producing **a link with no accessible name**.

Move the wishlist button out of the anchor, give it a state-dependent label plus `aria-pressed`, and render a placeholder when there is no image.

### 93. Adding a variant product from the grid produces a variantless line

`ProductCard.handleAddToCart` (`:31-45`) never sets `variantId` or `variantLabel` — the card has no variant picker. For a product whose variants carry a `priceDelta` or independent stock, the grid's add-to-cart silently creates a base line: no size, no colour, no price delta, and an order item with `variantLabel: null`.

Worse, that line has a *different* `cartLineKey` from the properly-configured line the detail page creates, so the same product appears twice in the cart — which is precisely the shape that triggers #78.

### 94. Price validation accepts free products and impossible discounts

`money = z.coerce.number().nonnegative().max(999_999)` (`products.validators.ts:23`) is used for `price`. `nonnegative()` admits `0`, and `product-form.tsx:73` builds the payload with `Number(values.price)`, where `Number("")` is `0`. **An admin who leaves the price field empty publishes a free product**, and there is no resolver to stop them (#17).

Also unvalidated:
- `compareAtPrice` is not required to exceed `price`. Set it lower and `calculateDiscountPercent` returns `null`, so the strike-through silently disappears with no explanation to the admin.
- `productFiltersSchema` never checks `minPrice <= maxPrice`; an inverted range returns an empty catalogue with no message.
- `productImageInputSchema.url` is `z.string().min(1)`, not a URL — any string reaches `next/image` (see #32) and any `javascript:` string reaches a `<Link href>` (#60 flags the same for banners).

### 95. The whole application is opted out of static rendering

`app/layout.tsx:38` awaits `cookies()` to read the locale, and `ThemeScript` (`theme-script.tsx:8`) awaits it again. Reading cookies in the root layout marks **every route in the app dynamic** — the home page, the product listing, and every product detail page are rendered per request, with no static generation, no ISR and no full-route cache.

That is a defensible trade for the locale (it makes `<html lang dir>` correct on first paint, as the comment explains). It is not defensible for the theme: `ThemeScript`'s cookie is never written by anything (#15), so the second `cookies()` call buys nothing at all. Removing it doesn't restore static rendering on its own, but the locale cost is worth stating explicitly — with `generateStaticParams`-style locale segments or a middleware-set header, the catalogue could be static.

### 96. Every storefront page is server-rendered at `opacity: 0`

`(storefront)/template.tsx:16` wraps all page content in `<motion.div initial={{ opacity: 0, y: 12 }}>`. framer-motion applies `initial` during SSR, so the server HTML for every storefront page carries `style="opacity:0;transform:translateY(12px)"` and only becomes visible once framer-motion hydrates and animates.

If the JS bundle fails, is blocked, or is slow, the page is **blank but present**. Combined with #26 (product pages are client-fetched anyway) and #50 (no `prefers-reduced-motion` handling), this is the third symptom of the same root: nothing renders usefully without JavaScript.

### 97. The order number survives only in React state

`checkout-form.tsx:31` holds `placedOrderNumber` in `useState`, and the success screen is a conditional branch of the same component. There is no `/orders/[number]` route and no redirect. Refresh, navigate away, or close the tab and **the order number is gone** — permanently for a guest, who has no account and (per #79) receives no email. For a cash-on-delivery store that number is the only handle for a support call.

### 98. `getMine` fires for signed-out visitors, and customer order history cannot be paged

```ts
// useGetMyOrders.ts
export function useGetMyOrders(page = 1) {
  return trpc.orders.getMine.useQuery({ page });
}
```

No `enabled` guard. `account/page.tsx:49` calls it unconditionally, above the `if (!user)` branch, so **every anonymous visit to `/account` fires a request that is guaranteed to throw `UNAUTHORIZED`** — twice, because the query client is configured with `retry: 1`.

Separately, the page calls it with no argument, so `page` is pinned to `1` and there is no pagination control. `myOrdersFiltersSchema` defaults `pageSize` to 10, so a customer's eleventh-oldest order is unreachable. Finding #8 scoped this problem to the five admin tables; it applies to the storefront too.

### 99. `useBodyScrollLock` does not do what its comment claims

```ts
/** … Restores the previous value on cleanup, nesting safely when several overlays stack. */
```

It does not nest. Each caller snapshots `document.body.style.overflow` at lock time and restores that snapshot on cleanup. Open the cart drawer (snapshot `""`, set `hidden`), then a modal (snapshot `hidden`, set `hidden`); close the **drawer** first and it restores `""` while the modal is still open — the page scrolls behind the overlay. Correct nesting needs a shared counter. Either implement one or correct the comment.

(The same file is also the only hook missing `"use client"` — #48.)

### 100. The low-stock count ignores the filter it is displayed beside

`listStockLevels` (`inventory.db.ts:81-84`) computes `lowStockCount` with a `where` clause containing only the threshold — it drops the `search` filter that scopes the rows above it, and it counts `archived` products. So searching the inventory screen narrows the table while the "low stock" figure beside it keeps showing the store-wide total.

### 101. Analytics silently drop and split records

- **`getRevenueByCategory` (`orders.db.ts:317-329`)** `innerJoin`s `products`, but `orderItems.productId` is `ON DELETE SET NULL`. Revenue from any deleted product vanishes from the report with no indication. It is also the only analytics query with **no time window** — every sibling filters to a `days` range, so the category chart is all-time while the rest of the page is 30- or 90-day.
- **`getTopSellingProducts` (`:312`)** groups by `orderItems.productNameEn, productNameAr` alongside `productId`. Those are per-order snapshots, so **renaming a product splits its sales into two rows**, each with a partial total, and neither may reach the top-10 cut.
- **`getDashboardStats.ordersToday` (`:233-236`)** counts cancelled orders, while `revenue30d` two lines above explicitly excludes them.

### 102. Order lines display in random order

`getOrderWithItems` (`orders.db.ts:167`) sorts with `asc(orderItems.id)` — a `defaultRandom()` UUID. Order items therefore appear in an arbitrary, stable-but-meaningless sequence in the admin order detail, unrelated to the order the customer built their cart in. `order_items` has no `displayOrder` or sequence column to sort on; adding one, or sorting by `productNameEn`, would both beat a random UUID.

### 103. `settings.currency` and `settings.defaultLocale` are inert

Extending #10: `settings.defaultLocale` (`banners.ts:40-42`) has the same problem as `settings.currency`. The locale actually used is `DEFAULT_LOCALE` from `constants.ts:5`, read by `app/layout.tsx:32` when no cookie is present. Nothing reads `settings.defaultLocale` anywhere. Both fields are editable in `/admin/settings`, both are validated, and neither has any effect.

---

## ⚪ Low

104. **`env.ts` cannot expose `NEXT_PUBLIC_*` to the browser.** `optional(key)` reads `process.env[key]` with a computed key (`env.ts:19`). Next inlines only *statically analysable* `process.env.NEXT_PUBLIC_X` member expressions, so `posthogKey` and `posthogHost` would be `undefined` in any client bundle. Latent today only because both are read exclusively from `lib/posthog.ts`, which nothing calls (#105).
105. **PostHog is entirely dead.** `trackEvent` is exported and never called from anywhere in `src/`. `CLAUDE.md` lists "Traffic sources (via PostHog)" and "Conversion funnel" as analytics modules; `traffic-chart.tsx` renders a placeholder string instead (#45). Not one event is instrumented — not add-to-cart, not checkout, not product view.
106. **All four form primitives delete the global focus ring.** `input.tsx:35`, `textarea.tsx:32` and `select.tsx:31` all set `focus:outline-none`, overriding the `:focus-visible { outline: 2px solid var(--color-accent) }` rule in `globals.css:144` and leaving only a 1px border-colour change. `modal.tsx:81` puts `outline-none` on the panel that `panelRef.current?.focus()` targets, so opening a modal moves focus somewhere with no visible indicator at all. WCAG 2.4.7.
107. **The focus ring itself is under-contrast.** `--color-accent` `#b08d57` against `--color-surface` `#f7f7f7` is ~2.7:1, below the 3:1 floor WCAG 2.2 SC 1.4.11 sets for non-text indicators.
108. **`scroll-behavior: smooth` is unconditional** (`globals.css:118`) with no `prefers-reduced-motion` override — the CSS-level instance of #50.
109. **No security headers and no SEO files.** `next.config.ts` defines no `headers()`, so there is no CSP, `X-Frame-Options`, `Referrer-Policy` or HSTS. There is no `robots.ts`, `sitemap.ts` or `manifest.ts`, and `/cart`, `/checkout` and `/account` carry no `robots: { index: false }`.
110. **`seed.ts:62` hard-deletes a user row** (`db.delete(users).where(eq(users.id, legacyAdmin.id))`), cascading to their sessions and accounts. With no `NODE_ENV` guard (#7), running `npm run seed` against production destroys whoever holds `admin@deneiz.com`.
111. **Default Next.js scaffolding is still in `public/`** — `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`, none referenced.
112. **The 404 page is outside the storefront shell.** `not-found.tsx` sits at `app/`, not in `(storefront)`, so it renders with no navbar, no footer and no cart access. It is also the only place with a hardcoded bilingual string (`"Page not found — الصفحة غير موجودة"`, bypassing the dictionary), and its sole link is labelled `Deneiz` rather than anything actionable.
113. **No CHECK constraints anywhere.** `reviews.rating` accepts any integer at the database level (1–5 is enforced only in Zod), `products.stockQuantity` and `productVariants.stockQuantity` accept negatives, `orderItems.quantity` accepts zero and negatives. The application is the only guard, and #1 means the application's guards are currently the ones failing.
114. **No `$onUpdate` on any `updatedAt` column.** Every one of the eight tables carrying `updatedAt` relies on each call site remembering `updatedAt: new Date()`. They all do today — but `reviews` has no `updatedAt` at all, so moderation actions leave no timestamp, and the next writer who forgets will drift silently. Drizzle's `.$onUpdate(() => new Date())` removes the whole class.
115. **Admin chrome renders outside the guard.** `admin/(dashboard)/layout.tsx:13-17` places `<Sidebar />` and `<Topbar />` above `<AdminRouteGuard>`, so a signed-in non-admin sees the complete admin navigation — every module name and route — framing the "no access" card.
116. **Dictionary typing is cast away** in `account/page.tsx:34` and `:106` (`t.statuses.order as Record<string, string>`). `DeepDictionary` is what guarantees ar/en key parity; two `as Record<string, string>` casts opt these lookups out of it and fall back to rendering the raw enum value.
117. **`variantLabel` is accepted from the client and ignored.** `checkoutItemInputSchema:28` validates it and `checkout-form.tsx:58` sends it, but `placeOrder` rebuilds the label from the database (`orders.service.ts:71-73`) — correctly. The field should be dropped from the schema rather than left as an input the server pretends to accept.
118. **Draft products appear in low-stock alerts.** `listLowStockProducts` (`products.db.ts:405`) includes `"draft"`, so unpublished work-in-progress products with zero stock pad the dashboard's most operational alert.
119. **`--spacing-section-y` uses `9vh`** (`globals.css:107`), against the project's own rule 6 ("prefer `dvh` over `vh` for mobile"). Every `.section-y` block shifts when mobile browser chrome hides.
120. **The `next` redirect check misses backslashes.** `account/page.tsx:46` accepts any value starting with `/` that does not start with `//`. `/\evil.com` passes; browsers normalise `\` to `/` in URL parsing, making it a protocol-relative URL. Reject any `next` containing `\`, or match against an allowlist of known admin paths.

---

## Revised order of work

The first pass's sequence still holds. Slotting the addendum in:

1. **#1** — unchanged; nothing works until the driver supports transactions.
2. **#2, #7, #76, #86, #110** — the security and deploy set, now including the bootstrap hook and the destructive seed.
3. **#3, #4, #82, #77, #89** — user-visible and small: two query params, two CSS blocks, one hydration guard, one formatter call.
4. **#78, #83, #79** — checkout correctness: aggregate the stock check, normalise phones, capture an email.
5. **#6, #9, #90** — make failures diagnosable *and* readable, in both languages.
6. **#81, #84** — one `ORDER BY` term and a set of `Promise.all`s. Both are mechanical and both affect every list in the app.
7. **#8, #98** — pagination, admin and storefront together.
8. Work the Medium list; land #69 (ESLint rules) early so the convention findings stop re-accumulating.

---

# Remediation plan

**Date:** 2026-08-24
**Method:** every finding above was re-grouped by *root cause* rather than by symptom, then each group was solved at its single shared point. Fix selection follows the [Ponytail](https://github.com/DietrichGebert/ponytail) ladder — reuse what exists, prefer the platform, prefer deletion, write new code last.

The 120 findings collapse into **14 batches**. Nine of them are a single edit to a single shared file. Nothing below adds a runtime dependency.

> **Reading the "side effects" line.** Every batch states what else moves when you make the change. Where a fix cannot be side-effect-free, that is said plainly and the decision is handed back rather than buried.

---

## Coverage map

| Batch | Fixes | One-line summary |
|---|---|---|
| **A** | 1 | Swap the Drizzle driver entry point |
| **B** | 4, 82, 107, 108, 119 | Complete the dark token block; fix two contrast failures |
| **C** | 2, 62, 115 | Gate uploads; export one `ADMIN_ROLES` |
| **D** | 6, 9, 18, 56, 90 | One error-key convention, reusing the one already in the codebase |
| **E** | 81, 84, 87, 59 | Three mechanical sweeps over the `db` layer |
| **F** | 77, 91, 96 | Render nothing store-derived before hydration; drop the JS-gated page fade |
| **G** | 78, 79, 83, 21, 93, 94 | Checkout correctness |
| **H** | 3, 5, 10, 89, 103, 40 | One source of truth for prices, shipping and settings |
| **I** | 8, 98 | Lift the pagination component that already exists |
| **J** | 7, 86, 110, 120, 80 | Auth and script safety |
| **K** | 85 | One timezone constant |
| **L** | 88, 33, 101, 102, 113, 114 | Data-integrity: soft delete, transitions, constraints |
| **M** | 49, 51, 92, 106, 50 | Accessibility |
| **N** | 69, 39, 41, 42, 43, 47 | Make the conventions machine-enforced |
| **—** | remainder | Table at the end: one line each |

---

## Batch A — the driver (#1)

**Root cause.** `src/db/index.ts:16` builds the client from `drizzle-orm/neon-http`, whose `transaction()` is a hard throw. Five write paths depend on it.

**The change — one file, two import lines.**

```ts
// src/db/index.ts
- import { neon } from "@neondatabase/serverless";
- import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
+ import { Pool } from "@neondatabase/serverless";
+ import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";

  export function getDb(): AppDatabase {
-   if (!cachedDb) { const sql = neon(env.databaseUrl); cachedDb = drizzle(sql, { schema }); }
+   if (!cachedDb) {
+     const pool = new Pool({ connectionString: env.databaseUrl, max: 5 });
+     cachedDb = drizzle(pool, { schema });
+   }
    return cachedDb;
  }
```

**Why this one.** Ladder rung 5 — an already-installed dependency solves it. `@neondatabase/serverless` exports `Pool` alongside `neon` (verified: `Client, DatabaseError, NeonDbError, …, Pool, …, neon, neonConfig`), and `drizzle-orm/neon-serverless` is already on disk. **No new package.** The alternative — restructuring five call sites to be transaction-free — is a far larger diff that also loses the atomicity the comments promise.

`neon-http`'s `db.batch()` was considered and rejected: it does run server-side in one transaction, but it takes a fixed list of statements up front. Checkout reads `updated.length` between statements to decide whether to abort, and `batch()` cannot express that.

**Side effects — three, all real, all bounded.**

1. **`ws` is not needed.** Neon's typings say a custom `webSocketConstructor` is required *"Only if no global `WebSocket` object is available, such as in older versions of Node."* This project runs Node v24, which has global `WebSocket`. Nothing to configure.
2. **The type name changes.** `NeonHttpDatabase<typeof schema>` → `NeonDatabase<typeof schema>`. It is absorbed by the existing `AppDatabase` alias, so **no call site changes** — `tsc --noEmit` is the proof.
3. **A Pool holds live sockets, where HTTP held none.** Two consequences worth handling:
   - *Dev hot-reload* re-evaluates modules and would leak a pool per reload. Pin the singleton to `globalThis` in development — the standard Next.js pattern:
     ```ts
     const globalForDb = globalThis as unknown as { db?: AppDatabase };
     export function getDb(): AppDatabase {
       globalForDb.db ??= drizzle(new Pool({ connectionString: env.databaseUrl, max: 5 }), { schema });
       return globalForDb.db;
     }
     ```
   - *If you later deploy to a serverless platform*, drop `max` to `1`. On a single long-lived node (`next start`), 5 is right. This is the one number in the batch that is deployment-dependent.

**Verify.** `npm run typecheck`, then place an order, adjust stock, and save a product. All three currently throw; all three should succeed. Finding #9's blanket `catch` is what disguises this today, so fix **D** first if you want a readable failure while testing.

---

## Batch B — the token block (#4, #82, #107, #108, #119)

**Root cause.** `globals.css` is the single owner of colour, exactly as `CLAUDE.md` requires — but the `[data-theme="dark"]` block redefines only some tokens, and two light values were never contrast-checked.

**The change — one file.**

```css
[data-theme="dark"] {
  /* … existing overrides … */
+ --color-text-inverse: #09090b;   /* was inheriting #ffffff → 1.04:1 on #fafafa */
+ --color-danger:  #f87171;        /* 4.1:1 → 7.2:1 */
+ --color-info:    #60a5fa;        /* 3.9:1 → 7.8:1 */
+ --color-warning: #fbbf24;        /* 11.9:1 */
}

:root {
- --color-warning: #d97706;        /* 3.0:1 on white — fails AA for the low-stock label */
+ --color-warning: #b45309;        /* 5.0:1 */
}
```

Contrast figures are computed against the actual background tokens (`#ffffff` light, `#09090b` dark) at the WCAG AA 4.5:1 threshold for text under 18pt — which is what these tokens are used on (`text-xs text-danger`, `text-xs text-warning`). `--color-success` measures 5.4:1 light and 6.0:1 dark and needs no change.

**Also in this file:**

```css
+ :root { --color-focus-ring: var(--color-text-primary); }   /* #107 */

  :focus-visible {
-   outline: 2px solid var(--color-accent);      /* #b08d57 on #f7f7f7 = 2.7:1, under the 3:1 floor */
+   outline: 2px solid var(--color-focus-ring);
  }

+ @media (prefers-reduced-motion: reduce) {      /* #108 */
+   html { scroll-behavior: auto; }
+ }

- --spacing-section-y: clamp(3.5rem, 9vh, 7.5rem);
+ --spacing-section-y: clamp(3.5rem, 9dvh, 7.5rem);   /* #119 — the project's own rule 6 */
```

`--color-focus-ring` aliases `--color-text-primary`, which is already themed both ways, so the ring inverts correctly with no second definition to maintain.

**Side effects.** Two visual changes, both intentional and both worth a glance before merging:
- Amber darkens slightly in light mode. Check `Badge tone="warning"` — if it renders `bg-warning/15 text-warning` the change only helps; if anything uses `bg-warning` with light text, re-check that pairing.
- The focus ring becomes near-black/near-white instead of gold. That is the point, but it is a visible design change.

Nothing else: no component file references a colour value, so no component file changes. **This batch is one file and touches nothing that can break at runtime.**

---

## Batch C — the upload gate and the role list (#2, #62, #115)

**Root cause, part 1.** `ADMIN_ROLES` is declared three times — `trpc.ts:84`, `admin-route-guard.tsx:9`, and inline at `account/page.tsx:124`. A fourth caller (the upload route) is about to need it. Ponytail's bug-fix principle applies: one guard in the shared place beats one per caller.

```ts
// src/lib/constants.ts
+ export const ADMIN_ROLES = ["super_admin", "manager", "staff"] as const;
+ export const DESTRUCTIVE_ROLES = ["super_admin", "manager"] as const;   // #62
```

Then delete the three local copies and import. `trpc.ts`'s `adminProcedure` keeps its behaviour verbatim.

**#62** — destructive procedures (`products.delete`, `categories.delete`, `reviews.delete`, `customers.setBan`) currently accept `staff`. Switch them from `adminProcedure` to the existing `requireRoles(DESTRUCTIVE_ROLES)`. `requireRoles` already exists and is already used in `settings.router.ts` — rung 2, no new mechanism.

**#115** — move `<Sidebar />` and `<Topbar />` inside `<AdminRouteGuard>` in `admin/(dashboard)/layout.tsx` so a non-admin sees the card, not the full admin navigation.

**Root cause, part 2 — the upload route.** Three defects in one handler; all three fixed in place.

```ts
// src/app/api/uploads/route.ts
export async function POST(request: Request): Promise<Response> {
+ // 1. Authenticate before reading a single byte
+ const session = await getAuth().api.getSession({ headers: request.headers });
+ const role = session?.user?.role;
+ if (!role || !ADMIN_ROLES.includes(role)) {
+   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+ }
+
+ // 2. Reject oversized bodies before buffering them
+ const declaredLength = Number(request.headers.get("content-length") ?? 0);
+ if (declaredLength > MAX_FILE_BYTES) {
+   return NextResponse.json({ error: "Image exceeds 5MB" }, { status: 413 });
+ }

  const formData = await request.formData();
  …
+ // 3. Trust the bytes, not the declared MIME
+ const bytes = new Uint8Array(await file.arrayBuffer());
+ const detected = detectImageType(bytes);
+ if (!detected) {
+   return NextResponse.json({ error: "Unsupported image format" }, { status: 415 });
+ }
- const extension = file.type.split("/")[1].replace("jpeg", "jpg");
+ const extension = detected;                       // "jpg" | "png" | "webp" | "avif"
```

`detectImageType` is ~10 lines of byte comparison (JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, `RIFF`…`WEBP`, `ftyp`…`avif`). No library — rung 7, and the smallest thing that actually closes the hole, since the extension now derives from verified bytes rather than a client header.

**Side effects.** `ImageUploader` already handles a non-`ok` response by toasting and continuing, so a rejected upload degrades correctly with no client change. The size precheck uses `content-length`, which a client can lie about — it is a cheap first gate, not the enforcement; the existing `file.size` check stays as the real one.

**Not fixed here, deliberately:** rate limiting on this route depends on Batch D's limiter having a real backend. Noted, not stubbed.

---

## Batch D — one error convention (#6, #9, #18, #56, #90)

**Root cause.** Five findings, one cause: business failures are thrown as plain `Error` carrying an English sentence. tRPC maps an unrecognised throw to `INTERNAL_SERVER_ERROR` and **replaces the message in production**, so stock and availability rejections reach the customer as nothing at all — and where messages *do* survive (the checkout form, #90), they are raw English Zod text on an Arabic store.

**The change — reuse the convention the codebase already invented.** `review-form.tsx:21-30` has a `translateZodMessage` helper that already expects keys shaped `"required"` and `"tooShort:2"`. It never fires only because no schema emits those keys. Generalise that helper instead of designing something new:

```ts
// src/lib/translate-error.ts   (generalised from review-form.tsx:21-30)
/** Messages travel as "key" or "key:arg" and are resolved against the dictionary. */
export function translateError(message: string | undefined, t: Dictionary): string {
  if (!message) return t.errors.generic;
  const [key, arg] = message.split(":");
  const entry = t.errors[key as keyof typeof t.errors];
  if (!entry) return t.errors.generic;
  return typeof entry === "function" ? entry(arg) : entry;
}
```

Then three mechanical edits:

1. **Services throw `TRPCError` with a key.** `orders.service.ts:36,50,51,62`, `reviews.service.ts:17`, `categories.service.ts`, `banners.service.ts`, `warehouse.service.ts`, `inventory.service.ts`:
   ```ts
   - throw new Error(`Only ${product.stockQuantity} left of "${product.nameEn}"`);
   + throw new TRPCError({ code: "CONFLICT", message: `stockOnly:${product.stockQuantity}` });
   ```
   The correct `code` per site: `CONFLICT` for stock, `BAD_REQUEST` for validation, `TOO_MANY_REQUESTS` for the review limiter, `FORBIDDEN` for the ban check. tRPC preserves messages on all recognised codes, in production too.

2. **Schemas carry keys.** `createOrderInputSchema` and friends get `{ message: "tooShort:2" }` on each rule. This is what makes #18 work and what stops #90 rendering English.

3. **Both dictionaries gain an `errors` block** with those keys — the `DeepDictionary` type makes `tsc` fail if `ar` misses one, which is the enforcement.

**#9 specifically** — narrow the blanket catch so it stops disguising Batch A:
```ts
// inventory.service.ts
- } catch { throw new Error("Stock adjustment rejected — result would go below zero"); }
+ } catch (error) {
+   if (error instanceof TRPCError) throw error;
+   captureException(error);
+   throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "generic" });
+ }
```
and move the real boundary check into `adjustStock`, which is the function that actually knows the update matched nothing.

**Side effects.** Every call site currently doing `pushToast(error.message || t.errors.generic)` becomes `pushToast(translateError(error.message, t))`. That is ~6 call sites and it is a strict improvement: today they display an English sentence in dev and nothing useful in production.

**One runnable check** (Ponytail: non-trivial logic leaves one behind) — `translateError` is a pure function over the dictionary; a three-case Vitest file covering key, `key:arg`, and unknown-key fallback is enough, and it runs under the existing `src/**/*.test.ts` config with no config change.

---

## Batch E — three sweeps over the `db` layer (#81, #84, #87, #59)

All three are mechanical, apply to the same ~10 query functions, and are best done in one pass over `src/server/*/*.db.ts`.

**Sweep 1 — stable ordering (#81).** Append the primary key as the final sort term everywhere a query pairs `ORDER BY` with `LIMIT`/`OFFSET`:
```ts
- .orderBy(sortClause(filters.sort))
+ .orderBy(sortClause(filters.sort), asc(products.id))
```
Drizzle's `orderBy` is variadic, so this is one argument per query. **Zero behaviour change for already-unique orderings; it only makes ties deterministic.** Without it, paging a price-sorted catalogue repeats and drops rows.

**Sweep 2 — parallel reads (#84).** Every list function runs its rows query and its `count(*)` serially, and each is a separate round trip:
```ts
- const rows  = await database.select({...})…;
- const [{ count }] = await database.select({ count: … })…;
+ const [rows, [{ count }]] = await Promise.all([
+   database.select({...})…,
+   database.select({ count: … })…,
+ ]);
```
Ten occurrences. Same for `getDashboardStats` (`orders.db.ts:220-265`), which awaits three independent aggregates before it reaches its existing `Promise.all` — fold all five into one. And `placeOrder` (`orders.service.ts:34-98`), where the ban check, product fetch, variant fetch and settings read are mutually independent:
```ts
+ const [banned, productRows, variantRows, settingsRow] = await Promise.all([…]);
```
Six sequential round trips become three. `CLAUDE.md`'s Data Fetching section prescribes exactly this and names checkout as the example.

**Side effects: none.** Every pair is two independent reads with no shared state. This is pure latency.

**Sweep 3 — escape `LIKE` wildcards (#87, #59).** One helper, applied at every `ilike` site:
```ts
// src/utils/escape-like.ts
/** `%` and `_` are LIKE wildcards — a search for "%" must match a literal percent. */
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");
```
```ts
- ilike(products.nameEn, `%${filters.search}%`)
+ ilike(products.nameEn, `%${escapeLike(filters.search)}%`)
```
Eight call sites across products, orders, inventory, customers and reviews, plus the two latent slug sites (#59). Pure function, trivially testable, and it is the shared-function fix rather than eight local ones.

---

## Batch F — render nothing store-derived before hydration (#77, #91, #96)

**Root cause.** `useIsHydrated` exists and its docstring states the rule precisely. Three places break it.

**#77 and #91 — use the hook that is already there.**
```tsx
// checkout-form.tsx — the important one: this branch picks between two whole trees
+ const isHydrated = useIsHydrated();
- if (items.length === 0 && !createOrder.isPending) {
+ if (isHydrated && items.length === 0 && !createOrder.isPending) {
```
Same two lines in `product-card.tsx` and `product-detail.tsx` for the wishlist heart (render the unfilled state until hydrated). Rung 2 — no new code, and it brings the three stragglers in line with the four surfaces that already do it.

**#96 — delete the framer-motion page wrapper, use CSS.** `(storefront)/template.tsx` server-renders every page at `opacity: 0` and depends on JS to reveal it.
```css
/* globals.css */
@keyframes page-enter { from { opacity: 0; transform: translateY(12px); } }
.page-enter { animation: page-enter 350ms cubic-bezier(0.22, 1, 0.36, 1); }
@media (prefers-reduced-motion: reduce) { .page-enter { animation: none; } }
```
```tsx
export default function StorefrontTemplate({ children }: LayoutProps<"/">) {
  return <div className="page-enter">{children}</div>;
}
```
Ladder rung 4 — the platform does this. Three wins for a smaller file: the page is **visible without JS**, `prefers-reduced-motion` is honoured (part of #50), and `usePathname` plus a framer-motion import leave the bundle. Deletion over addition.

**Side effects.** The animation now runs on CSS timing rather than framer-motion's — visually equivalent at the same duration and easing curve. `template.tsx` remounts per navigation either way, so the animation still retriggers.

---

## Batch G — checkout correctness (#78, #79, #83, #21, #93, #94)

The most valuable batch after A. All six live in the checkout path.

**#78 — aggregate before checking.** The availability check runs inside `input.items.map()`, once per line, against an unchanging `product.stockQuantity`. Two lines of one product (two variants — the normal case) each pass independently.
```ts
+ // Lines are keyed product+variant, so one product can appear twice — check the sum
+ const requested = new Map<string, number>();
+ for (const item of input.items) {
+   requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
+ }
+ for (const [productId, quantity] of requested) {
+   const product = productMap.get(productId);
+   if (!product) throw new TRPCError({ code: "BAD_REQUEST", message: "productMissing" });
+   if (product.stockQuantity < quantity) {
+     throw new TRPCError({ code: "CONFLICT", message: `stockOnly:${product.stockQuantity}` });
+   }
+ }
```
Then drop the per-line check from the `map`. **Purely additive** — the database guard in `placeOrderAtomic` stays as defence in depth.

**#79 — capture an email.** Three one-line additions unblock the entire confirmation-email path:
```ts
// orders.validators.ts
+ email: z.email().optional(),
// orders.service.ts — pass it to the upsert
  upsertCustomerByPhone({ fullName, phoneNumber, city, email: input.email ?? null })
// checkout-form.tsx — one more <Input>, prefilled from the session when signed in
```
`sendOrderConfirmationEmail` already short-circuits on a null recipient, so this changes nothing until Resend has a key — it just stops being structurally impossible.

**#83 — normalise the identity, keep the snapshot.** The clean split is already latent in the schema: `orders.phoneNumber` is documented as a contact *snapshot*, `customers.phoneNumber` is the unique *key*.
```ts
// src/utils/normalize-phone.ts
/** E.164-ish: strip formatting, keep a leading +. The customer key must be canonical. */
export const normalizePhone = (raw: string) => {
  const digits = raw.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits.replace(/^0+/, "")}`;
};
```
Store `normalizePhone(input.phoneNumber)` in `customers.phoneNumber` and in **both** ban lookups; store the raw string in `orders.phoneNumber`. Tighten the regex to require a real digit count: `/^\+?\d[\d\s-]{7,14}$/` with a post-normalisation `.length` check — the current `/^[+\d][\d\s-]{7,14}$/` accepts `+--------`.

> **Migration required.** Existing `customers` rows hold unnormalised numbers, and normalising can collide on the unique index. Run a one-off script that normalises, merges duplicate rows (keeping the oldest `id` and repointing `orders.customerId`), then apply the code change. This is the one fix in the plan that touches existing data — do it deliberately, not as part of a deploy.

**#21 — link the account, stop the overwrite.** `upsertCustomerByPhone` never sets `userId`, and its `onConflictDoUpdate` lets anyone rewrite a stranger's name and city by typing their phone number.
```ts
  .onConflictDoUpdate({
    target: customers.phoneNumber,
-   set: { fullName: record.fullName, city: record.city ?? undefined, updatedAt: new Date() },
+   // Only fill blanks on conflict — a returning customer must not be renamed by a guest
+   set: {
+     userId:   sql`coalesce(${customers.userId}, ${record.userId ?? null})`,
+     email:    sql`coalesce(${customers.email}, ${record.email ?? null})`,
+     city:     sql`coalesce(${customers.city}, ${record.city ?? null})`,
+     updatedAt: new Date(),
+   },
  })
```
`fullName` stops being overwritten entirely; the order row already snapshots the name for this purchase. This also closes the "a failed checkout still mutates the customer" path, because nothing destructive remains in the upsert.

**#93 — the grid must not fake a variant.** `ProductCard.handleAddToCart` creates a variantless line for products that have variants. Minimal correct fix: when `product.hasVariants`, the card navigates to the detail page instead of adding.
```tsx
- <button onClick={handleAddToCart}>
+ {product.hasVariants
+   ? <Link href={`/products/${product.slug}`} aria-label={t.product.chooseOptions}>…</Link>
+   : <button onClick={handleAddToCart}>…</button>}
```
Requires `ProductListRow` to carry `hasVariants` — one `exists(...)` subquery beside the existing `coverImageSql`, which is the same pattern already used twice in that file.

**#94 — price validation.** `money` is shared by `price`, `compareAtPrice` and `priceDelta`, which have different rules, so split rather than tighten in place:
```ts
+ const positiveMoney = money.refine((n) => n > 0, { message: "pricePositive" });   // price
  // compareAtPrice keeps `money` (0 and null are meaningful), plus a form-level cross-check
+ .refine((v) => v.compareAtPrice == null || v.compareAtPrice > v.price, { message: "compareAbovePrice" })
+ // productFiltersSchema
+ .refine((f) => f.minPrice == null || f.maxPrice == null || f.minPrice <= f.maxPrice)
```
`priceDelta` legitimately stays `money` (a zero delta is normal).

---

## Batch H — one source of truth for money (#3, #5, #10, #89, #103, #40)

**Root cause.** Values that the admin can edit are duplicated as compile-time constants, and two of them are computed with slightly different arithmetic in three places.

**#5 — extract the calculation, delete the constants.**
```ts
// src/utils/calculate-shipping.ts
export function calculateShipping(subtotal: number, settings: { shippingFee: number; freeShippingThreshold: number }): number {
  if (subtotal <= 0) return 0;
  return subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
}
```
Called by `orders.service.ts` (server) and by `cart/page.tsx` + `checkout-form.tsx` via **`useGetStoreSettings()`, which already exists** — rung 2, no new hook. Then **delete `FREE_SHIPPING_THRESHOLD` and `DEFAULT_SHIPPING_FEE` from `constants.ts`** so there is no second source left to drift back to. Deletion over addition.

This also resolves the `subtotal === 0` divergence between `cart/page.tsx` and `checkout-form.tsx` — one function, one rule, and it is unit-testable alongside the four utils Vitest already covers.

*Side effect:* cart and checkout now depend on a query. `settings.getStoreSettings` is a `publicProcedure` with a 30s `staleTime`, and both pages already render behind a hydration gate after Batch F — so there is no new flash. Render the shipping row as a dash until settings resolve rather than guessing with a constant.

**#10 / #103 — make `settings.currency` and `settings.defaultLocale` real or drop them.** `formatCurrency` hardcodes `CURRENCY_CODE`; `settings.defaultLocale` is read by nothing. Either thread settings through `formatCurrency(amount, locale, currency)` — a defaulted third parameter, so every existing call keeps working — or delete the two columns. **Recommend threading `currency`, deleting `defaultLocale`**: currency is plausibly editable, whereas the root layout's cookie fallback is the real locale default and a second knob would only conflict with it.

**#89 — one call site.** `checkout-form.tsx:143` prints the total via `total.toLocaleString(locale)`, which emits Arabic-Indic digits and no currency, contradicting `format-currency.ts`'s deliberate Latin-digit decision.
```tsx
- {t.checkout.placeOrder} — {total.toLocaleString(locale)}
+ {t.checkout.placeOrder} — {formatCurrency(total, locale)}
```

**#3 — two characters, two files.** `categories-grid.tsx:38` and `product-detail.tsx:92`: `?category=` → `?categorySlug=`. No regression risk — the old links never filtered anything.

**#40 — magic numbers.** `MAX_PAGE_SIZE` already exists and is already imported by three validators; use it in `products.router.ts:63` and `inventory.router.ts:16` instead of the literal `48`. `product-detail.tsx:120`'s `effectiveStock <= 5` becomes `settings.lowStockThreshold`, which is now in scope from the settings query this batch introduces.

---

## Batch I — pagination (#8, #98)

**Root cause.** A good pagination component already exists — `products/page.tsx:81-118`, with an ellipsis window and RTL-aware arrows — inlined into one page. Five admin tables and the account order list discard the `total` the server already returns.

**The change.** Move that JSX into `components/ui/pagination.tsx` with a `{ page, pageCount, onPageChange }` interface, then use it in six places. Every server procedure already accepts `page` and returns `total`, so **no server change at all** — this batch is purely client wiring.

Ladder rung 2 throughout: the component exists, the API exists, the data exists. The only new code is the props interface.

**#98 also needs** `useGetMyOrders(page)` to actually take its argument from state, and an `enabled` guard so signed-out visitors stop firing a guaranteed-`UNAUTHORIZED` request twice:
```ts
- return trpc.orders.getMine.useQuery({ page });
+ return trpc.orders.getMine.useQuery({ page }, { enabled: options.enabled ?? true });
```
with `account/page.tsx` passing `enabled: Boolean(user)`.

---

## Batch J — auth and script safety (#7, #86, #110, #120, #80)

**#7 + #110 — the seed script.** Credentials move to env, the script refuses to run against production, and the destructive user delete becomes opt-in:
```ts
- const DEMO_ADMIN_EMAIL = "admin@deneiz.com";
- const DEMO_ADMIN_PASSWORD = "deneiz-admin-123";
+ if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed production.");
+ const DEMO_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@deneiz.local";
+ const DEMO_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
```
Print the generated password once (it is a local dev account by construction) and drop the hardcoded pair from git history at the next convenient rewrite. `randomBytes` needs no import change — `node:crypto` is already imported for `randomUUID`. Guard `seed.ts:62`'s `db.delete(users)` behind an explicit `--reset` flag.

*Note:* `process.env` here is correct and does not violate the `env.ts` rule — that rule governs `src/`, and `scripts/` runs outside the app.

**#86 — the bootstrap hook needs a ceiling.** `ADMIN_EMAIL` currently grants `super_admin` to whoever registers that address, forever, with email verification off.
```ts
  const bootstrapEmail = env.adminBootstrapEmail?.toLowerCase();
  if (bootstrapEmail && user.email.toLowerCase() === bootstrapEmail) {
+   // Bootstrap is a one-shot: once any super_admin exists this path is closed
+   const [existing] = await getDb().select({ id: users.id }).from(users)
+     .where(eq(users.role, "super_admin")).limit(1);
+   if (existing) return { data: user };
    return { data: { ...user, role: "super_admin" } };
  }
```
One extra query, on user creation only. Turns a standing backdoor into what the comment already claims it is.

**#120 — the redirect check.** `account/page.tsx:46` accepts `/\evil.com`, which browsers normalise to a protocol-relative URL:
```ts
- const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";
+ const nextPath = /^\/(?![/\\])/.test(rawNext) ? rawNext : "/account";
```

**#80 — sign-out must clear the cache.** Mirror the sign-in handler eight lines above it:
```ts
  async function handleSignOut() {
    await authClient.signOut();
+   await queryClient.invalidateQueries();
    pushToast(t.account.signOut, "info");
  }
```
Two words. Without them the page keeps rendering the user's name, email and order history from cache.

---

## Batch K — timezone (#85)

**Root cause.** Three places derive a calendar day from UTC for an Egypt-facing store: the "orders today" KPI, the revenue chart buckets, and the `DNZ-YYYYMMDD-` order number.

**The change — one constant, three call sites.**
```ts
// src/lib/constants.ts
+ // ponytail: single store timezone. Upgrade path — move to settings.timezone
+ // if the business ever operates in more than one region.
+ export const STORE_TIMEZONE = "Africa/Cairo";
```
```ts
- sql`${orders.createdAt} >= date_trunc('day', now())`
+ sql`${orders.createdAt} >= date_trunc('day', now() AT TIME ZONE ${STORE_TIMEZONE}) AT TIME ZONE ${STORE_TIMEZONE}`
```
and the same `AT TIME ZONE` wrapping in `getSalesSeries`'s two `date_trunc` calls. For the order number, format with `Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIMEZONE })`, which yields `YYYY-MM-DD` directly — rung 3, no date library.

**Why a constant and not a settings column.** The audit found `settings.currency` and `settings.defaultLocale` already sitting unused (#10, #103); adding a third editable-but-unread field would repeat that mistake. The `ponytail:` comment names the ceiling and the upgrade path, per the ruleset.

**Side effect.** Existing rows do not change — this only affects how they are bucketed. Yesterday's dashboard numbers will shift by up to three hours' worth of orders on first deploy. Expected, and worth telling whoever reads the dashboard.

---

## Batch L — data integrity (#88, #33, #101, #102, #113, #114)

**#88 — archive instead of delete.** `products.status` already has an `archived` value, described in `CLAUDE.md` as one of the three lifecycle states and currently unused by the delete path. Hard delete cascades away `inventoryLogs` — the table whose own comment calls it an append-only auditable ledger — and `reviews`.

> **This one is a product decision, not a pure bug fix.** Changing `products.delete` to set `status: "archived"` means the admin "Delete" button stops removing rows. The clean version is: rename the action to **Archive** in the UI, make it the default, and keep a hard delete behind `requireRoles(["super_admin"])` with an explicit confirmation. I recommend that shape, but the call is yours — say the word and I will implement whichever you prefer.

**#33 — a transition table.** `orders.updateStatus` accepts any enum value for any order, so a delivered order can go back to pending and a cancelled one can be un-cancelled without re-deducting the stock that `cancelAndRestock` returned:
```ts
const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending:    ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped:    ["delivered", "cancelled"],
  delivered:  [],
  cancelled:  [],
};
```
Rejecting anything not listed also closes the `setPaymentStatus` gap (marking a cancelled order "collected") and makes `cancelAndRestock`'s check-then-act race unreachable through the API.

**#101, #102** — small and independent: window `getRevenueByCategory` like its siblings and `leftJoin` so deleted products' revenue is not silently dropped; group `getTopSellingProducts` by `productId` alone so a rename does not split the row; add a `displayOrder` to `orderItems` (written from the cart's line order) so order lines stop sorting by random UUID.

**#113 / #114 — let the database hold the invariants.** These belong in the same migration:
```sql
ALTER TABLE reviews      ADD CONSTRAINT rating_range   CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE products     ADD CONSTRAINT stock_positive CHECK ("stockQuantity" >= 0);
ALTER TABLE order_items  ADD CONSTRAINT qty_positive   CHECK (quantity > 0);
```
plus `.$onUpdate(() => new Date())` on every `updatedAt` column, which removes the class of bug where a future writer forgets the manual `updatedAt: new Date()` that all eight tables currently rely on.

**Prerequisite: #29.** `src/db/migrations/` does not exist — the schema has only ever been `db:push`ed. Run `npm run db:generate` to capture the current state as an initial migration **before** any of the above, so there is something to roll forward from.

---

## Batch M — accessibility (#49, #51, #92, #106, #50)

**#106 — delete, don't add.** `input.tsx:35`, `textarea.tsx:32` and `select.tsx:31` each set `focus:outline-none`, overriding the perfectly good `:focus-visible` rule in `globals.css`. `modal.tsx:81` does the same on the panel it programmatically focuses. **Remove those four declarations** and the global rule (retuned in Batch B) applies automatically. Fewest characters, best result.

**#49 — toasts need a live region.** One attribute pair on the `Toaster` container, not per toast:
```tsx
- <div className="fixed …">
+ <div className="fixed …" role="status" aria-live="polite" aria-atomic="false">
```
Toasts are the app's only feedback channel for cart, checkout and every admin mutation, and there is currently no `aria-live` anywhere in the codebase.

**#51 — associate errors with their inputs.** `input.tsx` already generates an id and already sets `aria-invalid`; it just needs to link the message:
```tsx
+ const errorId = `${inputId}-error`;
  <input … aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />
  {error ? <p id={errorId} role="alert">…</p> : …}
```
Same three lines in `select.tsx`, which today omits even the `role="alert"`.

**#92 — unnest the wishlist button.** Move it out of the `<a>` in `product-card.tsx` (position it absolutely against the `<article>` instead), give it a state-dependent `aria-label` and `aria-pressed={isInWishlist}`, and render a placeholder when `coverImageUrl` is null so the anchor is never nameless.

**#50 — reduced motion.** Batch B covers `scroll-behavior` and Batch F removes the page-transition wrapper entirely. What remains is the ten framer-motion usages: wrap them with the library's own `useReducedMotion()` — rung 5, already installed.

---

## Batch N — stop the drift (#69, #39, #41, #42, #43, #47)

**Root cause.** `eslint.config.mjs` is `next/core-web-vitals` + `next/typescript` and nothing else. **None** of the `CLAUDE.md` conventions are machine-enforced, which is exactly why the Low tier accumulated 30-odd convention findings. Fix the enforcement first; the individual violations then get caught rather than re-appearing.

```js
// eslint.config.mjs
rules: {
  "no-restricted-globals": [
    "error",
    { name: "confirm", message: "Use the Modal primitive — native dialogs are unstyled and untranslatable." },
    { name: "alert",   message: "Use pushToast or Modal." },
  ],
  "no-restricted-syntax": [
    "error",
    { selector: "MemberExpression[object.name='process'][property.name='env']",
      message: "Read configuration through src/env.ts." },
    { selector: "Literal[value=/\\b(bg|text|border|from|to)-(white|black)\\b/]",
      message: "Colors live in globals.css — use a token." },
  ],
  "react/no-array-index-key": "warn",
}
```

That covers #43 (five `window.confirm`/`alert` sites), the `process.env` rule, #39's 19 raw-colour utilities, and #47's mutable-list `key={index}`. `--fix` handles none of them, so budget a short pass to clear the errors the rules surface — but they will surface, which is the point.

**#41 / #42** are then straightforward: move the two inline router schemas into their `*.validators.ts`, and convert `auth-card.tsx`, `review-form.tsx` and `categories-tree.tsx`'s `CategoryForm` to React Hook Form + `zodResolver`, which Batch D's message keys make worthwhile — the error UI starts working the moment the resolver is wired.

---

## Everything else — one line each

| # | Fix |
|---|---|
| 11 | Accumulate into a local array, call `onChange` once after the loop — the closure captures `images` per render. |
| 12 | Replace the `locale === "ar"` test with `<picture>` + `media`, or `sizes`/`srcSet`. It is a viewport concern, not a language one. |
| 13 | `hero-section.tsx:42` — use `banner.linkUrl`, as `promo-banner.tsx:34` already does. |
| 14 | Use `listStockLevels`'s existing `COUNT(*)` for `lowStockCount` instead of `lowStock.length` on a list capped at 10. |
| 15 | Delete the `cookies()` read in `theme-script.tsx` — nothing writes that cookie. Removes one dynamic-render trigger (#95). |
| 16 | Diff variants by id and upsert; add `id` to `productVariantInputSchema` (it has none today, which is why wholesale replacement was chosen). Stops carts losing their `variantId`. |
| 17 | Add `zodResolver` to `product-form.tsx:121` and delete `buildProductPayload`'s manual validation plus the `window.alert`. |
| 19 | `useCallback` the five inline `onClose` handlers, or depend on a ref — the modal currently steals focus on every parent render. |
| 20 | Enforce variant stock server-side beside the product check added in Batch G. |
| 22 | Scope the ~20 `invalidateQueries()` calls to their tRPC keys; delete the one-off `useInvalidateAll`; add invalidation to `useCreateReview`, which has none. |
| 23 | Add TTL eviction to the in-memory limiter and key it on `ctx.user.id` where available. Real fix is Upstash; until then the `Map` grows forever. |
| 24 | Also check `countChildren(id) === 0` before allowing a parent assignment. |
| 25 | Write `reviews.userId` from `ctx.user`, and gate `authorName` to the account name when signed in. |
| 26 | Server-render the product page from the data `generateMetadata` already fetches; localise `metaTitle`/`metaDescription`. |
| 27 | Split the dictionary per locale and load one — both currently ship to every visitor. |
| 28 | Add `error.tsx` + `global-error.tsx`, and an `onError` on `fetchRequestHandler` that calls `captureException`. |
| 29 | `npm run db:generate` — prerequisite for Batch L. |
| 30 | Refuse to demote the last `super_admin`, and refuse self-demotion. |
| 31 | Replace `z.coerce.boolean()` with the `boolish` preprocess `products.validators.ts:24` already defines. |
| 32 | Constrain image inputs to `/uploads/…`, or widen `next.config.ts` deliberately. |
| 34 | One `SELECT … WHERE locationId = ? … SUM` instead of loading two full tables per assignment. |
| 35 | Add `/public/uploads` to `.gitignore`. |
| 36 | `crypto.randomBytes` for the order-number tail; let the unique index arbitrate with a retry instead of a pre-check `SELECT`. |
| 37 | Source `imageUrl` from the product in `orders.service.ts:79` — the column and the type already exist. |
| 38 | Pick one stock column as authoritative and derive the other. Pairs with #20. |
| 44 | Move the `@/db/schema` import out of `settings.validators.ts` — its siblings are deliberately dependency-free. |
| 45, 46 | Dictionary key for the PostHog placeholder; delete the identical-branch ternary at `review-form.tsx:123`. |
| 48 | Add `"use client"` to `useBodyScrollLock.ts`. |
| 52 | Add `aria-controls` + a `tabpanel` to `auth-card.tsx`'s tab pattern. |
| 53, 54 | `forwardedFor?.split(",")[0]?.trim() || …` (empty string is not nullish); report the swallowed session error to Sentry before degrading to guest. |
| 55 | Replace the two non-null assertions in `auth-card.tsx` with a `result.data` check. |
| 57 | Guard `getSettings()`'s `fallback` return — it can be `undefined` while typed `StoreSettings`. |
| 58 | Re-resolve slug uniqueness on update, as create already does. |
| 60, 61 | Constrain `banners.linkUrl` to a relative path or `http(s)` URL; validate the schedule when only one date is patched. |
| 63, 64 | Static import in `analytics.service.ts`; typed `orders` table instead of raw SQL in `customers.db.ts:84-95`. |
| 65 | Add `createdAt` to `verifications`; index every FK column — `orders.userId`, `orders.customerId`, `orderItems.orderId`, `productImages.productId`, `reviews.productId`, `inventoryLogs.productId`. Same migration as Batch L. |
| 66 | Money as `numeric` → JS `number`. Revisit as `mode: "string"` or integer minor units **before** discounts or tax land; the five `Math.round(x*100)/100` sites hold for two-decimal EGP today. |
| 67, 68 | Add jsdom + `.tsx` to the Vitest include so component tests can run at all; add `tsc --noEmit` to lint-staged. |
| 70–75 | Documentation drift: correct `CLAUDE.md`'s Tailwind section (v4 CSS-first is what is used, and it is better), mark Sentry/PostHog/Upstash/Resend as stubs, fix the tree (`db/migrations`, `settings.ts`), settle EGP-vs-Gulf (#74), and delete the dead exports listed in #75. |
| 76 | `getSessionCookie(request)` from `better-auth/cookies` in `proxy.ts` — handles the `__Secure-` prefix. **Do this before the first HTTPS deploy** or every admin is bounced. |
| 79, 97 | With #79's email in place, add `/orders/[orderNumber]` so the number survives a refresh — today it lives only in `useState`. |
| 84 | (Batch E.) |
| 99 | Shared counter in `useBodyScrollLock`, or correct the comment that claims nesting works. |
| 100 | Apply the active `search` filter to the `lowStockCount` query. |
| 104 | If anything ever reads `NEXT_PUBLIC_*` on the client, give `env.ts` explicit static accessors — `process.env[key]` with a computed key is never inlined by Next. |
| 105 | Either instrument `trackEvent` or delete it and the PostHog claims in `CLAUDE.md`. It is called from nowhere. |
| 109 | Add `headers()` to `next.config.ts` (CSP, `Referrer-Policy`, `X-Content-Type-Options`), a `robots.ts`, a `sitemap.ts`, and `robots: { index: false }` on cart/checkout/account. |
| 111, 112 | Delete the five unused Next.js starter SVGs; move `not-found.tsx` into `(storefront)` and pull its copy from the dictionary. |
| 116 | Drop the two `as Record<string, string>` casts in `account/page.tsx` — they opt out of the parity guarantee `DeepDictionary` provides. |
| 117 | Remove `variantLabel` from `checkoutItemInputSchema`; the server correctly rebuilds it and ignores the client's. |
| 118 | Drop `"draft"` from `listLowStockProducts`. |

---

## Sequencing

Each step is independently shippable and leaves the tree green.

| Step | Batches | Why here | Rough size |
|---|---|---|---|
| **1** | **A**, **D** | Nothing else is testable while five write paths throw and a blanket `catch` disguises the reason. Do them together — D is what makes A's success or failure legible. | 1 file + ~12 throw sites |
| **2** | **C**, **J**, #76 | The security set. #76 is a **deploy blocker** — it is invisible on localhost and breaks every admin on the first HTTPS release. | ~6 files |
| **3** | **B**, **F**, **H** | High-visibility user-facing fixes, all small: one CSS block, three hydration guards, one shipping function. | ~10 files |
| **4** | **G** | Checkout correctness. Contains the plan's only data migration (#83) — schedule it deliberately. | ~6 files + migration |
| **5** | **E**, **I** | Mechanical sweeps and pagination. Large diff, near-zero risk, entirely client-side for I. | ~15 files |
| **6** | **N** | Land the ESLint rules **before** the long tail, so convention fixes stay fixed. | 1 file + a cleanup pass |
| **7** | **L**, **M**, remainder | Data integrity (after #29's initial migration), accessibility, and the one-line table. | ongoing |

**Two things to decide before I start**, both flagged above rather than assumed:

1. **#88** — should "Delete product" become "Archive", with hard delete reserved for `super_admin`? My recommendation is yes; it is a behaviour change either way.
2. **#83** — the phone-normalisation migration merges duplicate customer rows. I would write it as a dry-run-first script that reports collisions before touching anything.

---

# Implementation status

**Date:** 2026-08-24 · **Verified:** `tsc --noEmit` clean · `eslint --max-warnings=0` clean · `vitest run` 36/36 · `next build` succeeds.

All 14 batches landed. Test count went 18 → 36; the new suites cover the pure functions this work introduced (`translate-error`, `normalize-phone`, `calculate-shipping`, `escape-like`).

## The two decisions, as taken

Both were flagged in the plan and resolved in favour of the recommended option:

- **#88** — `products.delete` is now **archive by default** (`products.archive`, `manager`+), with irreversible deletion kept as a separate `products.delete` restricted to `super_admin`. The admin table's trash control archives and asks for confirmation with new copy in both locales.
- **#83** — phone normalisation ships with **`scripts/normalize-customer-phones.ts`, dry-run by default**. It reports every rewrite and merge and only writes with `--apply`. Merges keep the oldest row, fill its blanks from duplicates, repoint `orders.customerId`, and preserve a ban if *any* merged row carried one.

## What changed, by batch

| Batch | Outcome |
|---|---|
| **A** | `src/db/index.ts` now builds a `neon-serverless` `Pool`. **No new dependency** — `Pool` ships in the already-installed `@neondatabase/serverless`, and Node 24's global `WebSocket` means no `ws` and no `neonConfig`. Pool pinned to `globalThis` so dev hot-reload cannot leak connections. Not one call site changed. |
| **B** | Dark block completed (`--color-text-inverse`, `danger`, `info`, `warning`); light `--color-warning` darkened to clear 4.5:1. New `--color-focus-ring` (aliases `text-primary`, so it inverts for free). `9vh` → `9dvh`. Global `prefers-reduced-motion` block. |
| **C** | `/api/uploads` gated on an admin session, `Content-Length` pre-checked before buffering, and the stored extension derived from **magic bytes** rather than the client's `Content-Type`. `ADMIN_ROLES`/`DESTRUCTIVE_ROLES` centralised in `constants.ts` — the role list had been declared three times. Destructive procedures moved off `adminProcedure`, so `staff` can no longer delete catalogue data. Admin chrome moved inside the guard. |
| **D** | New `server/app-error.ts` + `lib/translate-error.ts`. Business failures throw `appError(code, key, params)`; the key rides in `cause` and `errorFormatter` publishes it as `data.appError` beside the existing `zodError`. ~45 keys added to **both** dictionaries — `DeepDictionary` makes `tsc` fail if one locale is missing. All 14 `error.message \|\| t.errors.generic` toasts now call `translateError`. Validators emit `"tooShort:2"`-style keys, which is what finally makes the pre-existing `review-form` helper fire. `inventory.service`'s blanket `catch` narrowed. |
| **E** | Stable `ORDER BY` (primary key tiebreaker) on every paginated query; ten serial rows+count pairs and the five-query dashboard folded into `Promise.all`; `escapeLike` applied at every `ilike` site. |
| **F** | `useIsHydrated` added to checkout and both wishlist surfaces. `template.tsx`'s framer-motion wrapper replaced with a CSS keyframe — pages now render **visible without JS** and honour reduced motion, and the file lost an import. |
| **G** | Stock checked against the **sum per product**, not per line; variant stock enforced server-side on the same basis; optional email captured and threaded to the customer row; phones normalised for the identity key while `orders.phoneNumber` keeps the raw snapshot; the guest upsert now only fills blanks (`coalesce`), so nobody can rename a stranger by typing their number; grid add-to-cart links to the detail page when a product has variants; `price` must be positive and `compareAtPrice` must exceed it. |
| **H** | `utils/calculate-shipping.ts` is the single owner, used by `orders.service` and by both client surfaces via the existing `useGetStoreSettings`. `FREE_SHIPPING_THRESHOLD`/`DEFAULT_SHIPPING_FEE` **deleted** so nothing can drift back. Place-order button uses `formatCurrency`. `?category=` → `?categorySlug=`. |
| **I** | `components/ui/pagination.tsx` lifted out of the product listing; wired into all five admin tables plus the customer's own order history, with search resetting to page 1. Page size centralised as `ADMIN_PAGE_SIZE`. |
| **J** | Seed credentials read from env with a generated fallback, a `NODE_ENV=production` refusal, and its user-delete behind `--reset`. The `ADMIN_EMAIL` bootstrap is now one-shot — it closes as soon as any `super_admin` exists. Sign-out invalidates the cache. `next` redirect rejects the backslash form. |
| **K** | `STORE_TIMEZONE` constant; "orders today", both chart bucketings, the JS zero-fill, and the order-number date all cut in `Africa/Cairo`. |
| **L** | Archive-by-default (see above); an order status transition table (which also makes the cancel race unreachable); `getRevenueByCategory` `leftJoin`ed and windowed; top-sellers grouped by id alone; `orderItems.displayOrder`; CHECK constraints for rating/stock/quantity; `$onUpdate` on every `updatedAt`; FK indexes. Captured in `src/db/migrations/0000_*.sql` via `db:generate` — **the schema had no migration history at all before this.** |
| **M** | Four `focus:outline-none` overrides deleted so the global ring applies; toasts got `role="status"` + `aria-live`; inputs and selects link their error via `aria-describedby`; the wishlist button unnested from the product-card link with `aria-pressed` and a state-dependent label; `useReducedMotion` across every remaining animation. |
| **N** | ESLint now enforces the conventions: no `window.confirm`/`alert`, no `process.env` outside `env.ts`, no raw colour utilities, no hex outside `globals.css`, no `any`. The rules **caught all 19 raw colour utilities on first run**, which is how they were found and fixed rather than re-accumulating. `lint-staged` gained `tsc --noEmit` and `vitest run`. |

## Notable implementation notes

- **New tokens `--color-scrim` and `--color-on-media`** were needed for #39: text and overlays that sit on photography must *not* flip with the theme, so `text-text-inverse` would have been wrong for them. Both are declared once in `:root` with no dark override, deliberately.
- **`window.confirm` needed a replacement, not just removal.** `components/ui/confirm-dialog.tsx` wraps the existing `Modal` and returns a stable `close` callback — which also matters for #19, since `Modal`'s focus effect keys on `onClose` identity.
- **Variant diffing (#16) drove a schema change**: `productVariantInputSchema` gained an optional `id`, because the wholesale delete-and-reinsert existed precisely because the payload had no way to identify a row. `updateFullProduct` now upserts and deletes only what is absent.
- **jsdom was added as a dev dependency** for #67 — component tests genuinely require a DOM. It is *not* the default environment: jsdom cost ~63s of startup for pure-node suites, so `vitest.config.ts` keeps `node` and component tests opt in with a `// @vitest-environment jsdom` docblock.
- **`sitemap.ts` guards its database read** the way `generateMetadata` already did, so a build without database access degrades to the static routes instead of failing.

## Deliberately not done

- **#66 (money as `numeric` → JS `number`)** — left as-is. The five `Math.round(x*100)/100` sites are correct for two-decimal EGP, and switching to minor units or `mode: "string"` touches every price path in the app. The audit's advice stands: revisit **before** discounts or tax land, not now.
- **#27 (both locale dictionaries ship to every client)** — needs a per-locale split with a server boundary; a bundle-size refactor, not a defect fix.
- **#26 (product pages are client-rendered)** — metadata is now bilingual with OpenGraph and a canonical, but converting the page itself to server rendering is an architecture change rather than a fix.
- **#23 (rate limiting)** — still the in-process `Map`. A real limiter needs Upstash, which is not installed; adding it is a dependency and infrastructure decision.
- **#105 (PostHog)** — `trackEvent` is still called from nowhere. Instrumenting it means choosing which events matter, which is a product question.

Each of these is a scope decision, not an oversight — they are the items where the honest fix is larger than the finding.

---

# Post-implementation review (round 2)

**Date:** 2026-08-25 · **Verified:** `tsc --noEmit` clean · `eslint --max-warnings=0` clean · `vitest run` 41/41 · `next build` succeeds.

A review pass over the remediation itself found eight defects and three missing
features. All are fixed. The three that mattered most are recorded in full,
because each says something about how the first pass went wrong.

## #121 — The phone normalizer was wrong for the only market this store serves

`normalizePhoneNumber` dropped the domestic trunk zero without adding the
country code, so `01012345678` became `+1012345678` instead of `+201012345678`.
`phonePattern` accepts a leading digit, so the domestic form — the way an
Egyptian customer actually types their own number — reached it.

Three consequences, in ascending order of seriousness:

1. One person still produced two customer rows, which is precisely what the
   normalizer was introduced to prevent.
2. **The ban check was evadable.** `isCustomerBannedByPhone` keys on the
   canonical value, so a customer banned as `+20101…` returned as `+1101…`
   simply by typing their number the local way.
3. `scripts/normalize-customer-phones.ts` could not do its job: the `+20…` /
   `010…` pair it exists to merge normalized to two different keys.

**Why the test suite did not catch it.** `normalize-phone.test.ts` asserted that
`normalizePhoneNumber("01234567890")` equals `"+1234567890"` — the wrong answer,
under a name ("drops a domestic trunk zero") that described half of a correct
transform. 36/36 green gave false assurance about the one function whose entire
purpose is correctness. **A test written from the implementation instead of from
the requirement is worse than no test**, because it converts a bug into a
guarantee. The fix was written test-first: the corrected expectations were
committed and observed failing before the implementation was touched.

Now handles all four real input shapes — `+20…`, `0020…`, `010…`, bare
`1012345678` — plus a country code typed without a plus, length-checked so a
national number beginning `20` is not mistaken for one.

## #122 — Variant stock was validated and never decremented

Batch G added aggregate variant stock validation, but `placeOrderAtomic` only
ever touched `products.stockQuantity`. Grepping every write confirmed
`productVariants.stockQuantity` was written **only** by the admin product
editor — never on sale, never on cancellation. A variant with two units in stock
sold indefinitely.

This was arguably made worse by the first pass rather than better: adding the
check made variant stock *look* enforced. **A validation without the
corresponding write is not a half-fix, it is a disguised bug.**

`order_items` gained a `variantId` column to make it fixable at all — the
existing `variantLabel` is a display snapshot and cannot be resolved back to a
row, so cancellation had no way to know which variant to credit.

## #123 — The stock message that mattered most was the one left untranslated

`orders.db.ts` threw a raw `Error` for insufficient stock and `inventory.db.ts`
threw one for a rejected adjustment. These are the **race-loss** paths: the
pre-check passed and the guarded `UPDATE` lost. tRPC rewrites both to
"Internal server error", so the customer saw a generic toast and Sentry received
them as unexpected exceptions.

The tell was that `stockBelowZero` already existed in both dictionaries and was
called from nowhere — the translation had been added and the throw never wired.

The failure branch now re-reads current stock (only on this rare path) so the
count in "Only N left" is true rather than a guess.

## #124 — Untyped error keys are what let #123 and its siblings hide

`appError(code, key, params)` typed `key` as a bare `string`. `DeepDictionary`
guarantees the two locales agree **with each other**; it cannot tell whether a
thrown key exists at all, and an unknown key degrades silently to
`errors.generic` with no compile error.

`AppErrorKey = keyof Dictionary["errors"]` (a type-only import, so no dictionary
data reaches the server bundle) turns every such miss into a build failure. It
immediately caught `customerNotFound`, which did not exist yet.

Diffing keys in use against the dictionary found what the type would have
prevented:

- **Six routers still threw English prose** — "Order not found",
  "Product not found" ×2, "Category not found", "Banner not found",
  "Customer not found". Batch D converted the services and missed the routers.
- **`inventory.validators.ts`** still carried a prose message for a non-zero
  adjustment, which rendered as "Something went wrong".

## #125–#128 — Correctness and operational

| # | Issue | Fix |
|---|---|---|
| **#125** | `cancelAndRestock` ran N independent `adjustStock` transactions then a separate status write. A mid-way failure left an order partly restocked but still not cancelled — and retrying restocked those lines again. | `cancelOrderAndRestock` does stock, variant stock, ledger and status flip in one transaction. `changeOrderStatus` now routes `cancelled` to it, so no caller can strand reserved units. |
| **#126** | `sitemap.ts` paged at `MAX_PAGE_SIZE`, silently capping the sitemap at 48 products. | `listPublishedProductSlugs()` — unpaginated, and narrow (slug + `updatedAt`) so it stays cheap. |
| **#127** | The upload size gate defaulted a missing `Content-Length` to `0`, so a chunked body passed the pre-check and `formData()` buffered it unbounded. | Missing or non-positive length is now `411 Length Required`. |
| **#128** | `rate-limit.ts` never removed buckets — one entry per distinct IP for the life of the process. | Expired entries are swept on write past a threshold. No timer, which would keep a serverless instance alive. |

Also: a `freeShippingThreshold` of zero made **every** order ship free, the exact
opposite of an admin clearing the field to switch free shipping off. Zero now
reads as disabled. `Pagination`'s `aria-label` was hardcoded English, against
this project's own bilingual rule. `placeOrderAtomic`'s doc comment claimed the
customer upsert was inside its transaction; it never was, and now says so.

## Missing features, now built

- **#129 — Guest orders were unretrievable.** Checkout is open to guests, but
  the confirmation lived in component state (a refresh lost it), `getById` is
  admin-only, `getMine` needs an account, and the confirmation email is still a
  logging stub. A guest ended up with nothing. `/orders/lookup` takes the order
  number plus the phone used at checkout, rate limited because order numbers are
  short. "No such order" and "wrong phone" return one message — distinguishing
  them would confirm an order number exists. The confirmation screen now links
  to it and tells the customer to keep the number.
- **#130 — Reviews had no purchase verification.** Anyone could review any
  product, with no duplicate guard. Reviews now carry `isVerifiedPurchase`
  (stored, not derived, so the badge cannot change if the order is later
  cancelled), and one account may review a product once — enforced by a partial
  unique index, with the race caught as a unique violation and surfaced as a
  real message. Guests can still review; they simply never get the badge.

## Deployment: `db:migrate` needed a baseline first

The schema had been built with `db:push`, so migration `0000` is a full
baseline — 17 `CREATE TABLE`s, no `IF NOT EXISTS` — against a database that
already has every table. `drizzle-kit migrate` would have aborted on the first
statement. The previous section recommended running migrations without checking
this.

`npm run db:baseline` records `0000` as applied without executing it (drizzle
hashes the whole file with SHA-256 into its `__drizzle_migrations` table), so
`0001` onward runs normally. Dry-run by default, `--apply` to write.

**Before running `0001`,** check for reviews that violate the new one-per-account
rule; the unique index will refuse to build otherwise:

```sql
select "productId", "userId", count(*)
from reviews where "userId" is not null
group by 1, 2 having count(*) > 1;
```

Rows returned are a decision for the store owner — the migration deliberately
does not delete customer content on its own.

## Still deliberately not done

Unchanged from the previous section: **#66** (money as `numeric` to `number`),
**#27** (dictionary split), **#26** (server-rendered product pages), **#23**
(real rate limiting needs Upstash) and **#105** (PostHog instrumentation).
