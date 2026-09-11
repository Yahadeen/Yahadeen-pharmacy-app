# Yahadeen — Implementation Plan

Living document. Status markers: `[x]` done · `[~]` in progress · `[ ]` not started.

---

## 1. Locked decisions

### 1.1 Database — Supabase Postgres (not MongoDB)

**Decision: Supabase.**

| Why | Detail |
|---|---|
| The data is relational | `orders → order_items → products → inventory`, `payments → orders`, `addresses → customers`. Every read is a join. |
| Stock needs real transactions | When payment succeeds we must decrement stock atomically. Postgres gives `BEGIN … SELECT … FOR UPDATE … COMMIT`, so two customers cannot both buy the last pack. MongoDB multi-document transactions need a replica set and are slower and easier to get wrong. |
| One vendor covers four needs | Postgres + Auth (JWT, roles, password reset, OTP) + Realtime (order status, stock, chat pushed over websockets) + Storage (product images, prescription uploads). With MongoDB we would bolt on a separate auth provider, a separate realtime layer, and a separate file store — three more bills and three more integrations for the same scope. |
| Restock notifications are a query | "notify everyone watching product X" is a `restock_watchers` join + a Realtime broadcast. Trivially relational. |
| The proposal already says so | `docs/documentations.md` §10 lists PostgreSQL / Supabase PostgreSQL as the recommended options. Switching to MongoDB would be a scope change to re-quote. |

MongoDB would only win if the records were schema-fluid documents. Drug catalogues, orders and payments are the opposite of that.

### 1.2 Backend — Next.js Route Handlers + service layer

Option One from `documentations.md` §7. One deployable serves the admin dashboard **and** the API for all three clients.

```
Mobile app  ──┐
Mobile app  ──┼──►  apps/admin-app  ──►  Supabase Postgres
Admin (SSR) ──┘     /api/*  (thin)        (service-role key,
                    /server/services      server-side only)
                    (all business logic)
```

- **Auth**: mobile signs in with the Supabase JS SDK directly → receives a JWT. Every API call sends `Authorization: Bearer <jwt>`. Route handlers verify the token and load the caller's role before touching data. The service-role key never leaves the server.
- **Realtime**: mobile subscribes to Supabase Realtime directly (RLS-guarded) for order status, stock changes and chat. No polling, no websocket server to run.
- **Migration path**: because business logic lives in `server/services/*` and not inside route files, lifting it into a NestJS service later is a copy of that folder plus a controller layer.

### 1.3 Mobile UI layer — theme tokens + `StyleSheet` + `expo-blur`

**NativeWind is being removed from both mobile apps.**

It is currently mis-wired (v4 installed, v2 Babel syntax, no `metro.config.js`, no CSS entry), so every `className` already written renders unstyled. More importantly, `worknow-mobile` — the design you asked us to match — is built with a token palette and `StyleSheet`, not Tailwind. Matching it means using the same primitives. This also removes a build-config failure mode from Expo Go.

Tailwind stays where it is native: the Next.js admin dashboard.

### 1.4 Bottom navigation — 3 tabs, floating glass pill

Ported from `worknow-mobile/app/(app)/(tabs)/_layout.tsx`: a content-sized `BlurView` pill floating above the safe area; the active tab expands into a solid brand-blue pill with icon + label, inactive tabs are icon-only. Haptic on press.

| App | Tabs | Reached by push, not a tab |
|---|---|---|
| Customer | **Home** · **Orders** · **Account** | Search, category, product, cart, checkout, order tracking, chat, addresses, prescription, notifications, settings |
| Attendant | **Queue** · **Inventory** · **Account** | Order detail, stock edit, chat, notifications |

Cart is a header button with a live badge, not a tab — keeps the bar at three and the app light.

### 1.5 Brand palette (sampled from `logo/Yahadeen.png`)

| Token | Value |
|---|---|
| `primary` | `#0036B6` |
| `primaryDeep` | `#00279F` |
| `primaryBright` | `#0058EC` |
| `accent` (green) | `#10BF41` |
| `accentDeep` | `#038C3F` |
| `accentBright` | `#69ED2F` |
| Signature gradient | `#0040D0 → #10BF41` (the logo's blue→green sweep) |

---

## 2. Monorepo layout

```
Yahadeen/
├── .npmrc                     node-linker=hoisted  (Metro-safe pnpm)
├── pnpm-workspace.yaml
├── turbo.json
├── docs/
├── logo/
├── supabase/
│   ├── schema.sql             tables, indexes, triggers
│   ├── policies.sql           row-level security
│   └── seed.sql               categories + demo drugs
├── packages/
│   └── shared/                @Yahadeen/shared — pure TS, zero deps
│       └── src/{types,enums,brand,money,index}.ts
└── apps/
    ├── customer-app/          Expo SDK 57
    ├── attendant-app/         Expo SDK 57
    └── admin-app/             Next.js 16 — dashboard + API
```

`@Yahadeen/shared` holds the order-status enum, DB row types and money helpers so the three apps cannot drift. Consumed by Metro via workspace resolution and by Next via `transpilePackages`.

---

## 3. Data model

| Table | Notes |
|---|---|
| `profiles` | 1:1 with `auth.users`. `role` ∈ `customer` \| `attendant` \| `admin` \| `super_admin`. `is_active`. |
| `addresses` | Per customer, `is_default`, `lat`/`lng` for the distance-based delivery fee. |
| `categories` | `name`, `slug`, `icon`, `sort_order`. |
| `products` | `name`, `generic_name`, `brand`, `description`, `image_url`, `category_id`, `price_kobo`, `requires_prescription`, `is_active`. |
| `inventory` | 1:1 with `products`: `quantity`, `low_stock_threshold`, `updated_by`, `updated_at`. Split from `products` so stock writes don't contend with catalogue edits. |
| `orders` | `code` (human ref e.g. `PG-4F2A19`), `customer_id`, `status`, `subtotal_kobo`, `delivery_fee_kobo`, `total_kobo`, `address_snapshot` (jsonb — the address as it was at checkout), `attendant_id`, timestamps per status. |
| `order_items` | `order_id`, `product_id`, `name_snapshot`, `unit_price_kobo`, `qty`. Snapshots so a later price edit never rewrites history. |
| `payments` | `order_id`, `provider`, `provider_ref`, `status`, `amount_kobo`, `raw` (jsonb webhook body). |
| `deliveries` | `order_id`, `provider`, `tracking_ref`, `rider_name`, `rider_phone`, `status`, `eta`. |
| `chat_threads` / `chat_messages` | Thread per order; `sender_id`, `body`, `attachment_url`, `read_at`. |
| `notifications` | `user_id`, `title`, `body`, `data` jsonb, `read_at`. |
| `push_tokens` | `user_id`, `token`, `platform`. |
| `restock_watchers` | `user_id` × `product_id` — the notify-me-when-back list. |
| `stock_movements` | Append-only audit: who changed what stock, when, why. |

Order status machine (shared enum, enforced server-side):

```
pending_payment → paid → confirmed → preparing → packed
   → ready_for_pickup → picked_up → out_for_delivery → delivered
        ↘ cancelled (from any pre-picked_up state)
        ↘ payment_failed (from pending_payment)
```

---

## 4. API surface (`apps/admin-app/src/app/api/*`)

| Route | Method | Caller | Purpose |
|---|---|---|---|
| `/api/me` | GET | all | Profile + role for the bearer token |
| `/api/me` | PATCH | customer | Update name/phone/avatar |
| `/api/categories` | GET | all | Catalogue categories |
| `/api/products` | GET | all | Search + filter + paginate, joined with live stock |
| `/api/products/[id]` | GET | all | Detail + stock + related |
| `/api/products` | POST | admin | Create |
| `/api/products/[id]` | PATCH/DELETE | admin | Edit / deactivate |
| `/api/inventory/[productId]` | PATCH | attendant, admin | Set stock, writes `stock_movements`, fires restock notifications |
| `/api/addresses` | GET/POST | customer | Saved addresses |
| `/api/addresses/[id]` | PATCH/DELETE | customer | Edit / remove |
| `/api/delivery/quote` | POST | customer | Distance-based fee for an address |
| `/api/orders` | POST | customer | Validate cart → price → reserve → create `pending_payment` |
| `/api/orders` | GET | customer, attendant, admin | Scoped list + status filter |
| `/api/orders/[id]` | GET | scoped | Full order with items, payment, delivery |
| `/api/orders/[id]/status` | PATCH | attendant, admin | Advance the state machine |
| `/api/orders/[id]/cancel` | POST | customer, admin | Cancel + release stock |
| `/api/payments/init` | POST | customer | Open a provider transaction |
| `/api/payments/webhook` | POST | provider | Verify signature → mark paid → decrement stock → dispatch |
| `/api/chat/[orderId]` | GET/POST | scoped | Thread messages |
| `/api/notifications` | GET | all | List |
| `/api/notifications/read-all` | POST | all | Mark read |
| `/api/push/register` | POST | all | Store Expo push token |
| `/api/restock-watch` | POST/DELETE | customer | Join / leave a product's notify list |
| `/api/admin/stats` | GET | admin | Overview tiles |
| `/api/admin/reports` | GET | admin | Sales, best-sellers, low stock, delivery performance |
| `/api/admin/attendants` | GET/POST | admin | Staff accounts |
| `/api/admin/customers` | GET | admin | Customer list + history |

Every handler is ~15 lines: parse → authorise → call a service in `src/server/services/*` → shape the response. All logic lives in the services.

---

## 5. Screen inventory

### Customer app
| Route | Screen |
|---|---|
| `index` | Boot gate: brand mark while the stored session is read, then redirects |
| `(auth)/welcome` | Gradient + glass hero with three perk cards |
| `(auth)/login` · `signup` · `forgot-password` | Supabase Auth forms |
| `(tabs)/index` | Deliver-to bar, search field, category rail, restocked strip, prescription banner, popular drugs |
| `(tabs)/orders` | Active orders with live status pills + history |
| `(tabs)/account` | Profile, addresses, notifications, support, theme, sign out |
| `search` | Debounced search, category + availability filters, price sort |
| `category/[slug]` | Category listing, 2-up grid, sort rail |
| `product/[id]` | Hero image, price, live stock, prescription flag, qty stepper, notify-me when out |
| `cart` | Line items, qty edit, free-delivery progress, subtotal |
| `checkout` | Address picker, prescription upload, delivery quote, total, pay |
| `order/[id]` | Status timeline, items, rider card, pay / cancel / reorder |
| `addresses` | Saved addresses, add-or-edit sheet, default picker |
| `notifications` | Order + restock feed, mark read, deep link to the subject |
| `profile-edit` | Modal: name and phone; email is read-only (it is the sign-in identity) |
| `chat/[orderId]` | Deferred — the order screen currently says support chat is coming |

### Attendant app
| Route | Screen |
|---|---|
| `index` · `(auth)/welcome` · `(auth)/login` | Boot gate + staff sign-in |
| `(tabs)/index` | Live queue grouped New / Preparing / Ready, pull-to-refresh |
| `(tabs)/inventory` | Stock list, low-stock first, inline adjust |
| `(tabs)/account` | Profile, shift info, notifications, sign out |
| `order/[id]` | Item checklist, confirm/reject, advance status, chat |
| `stock/[productId]` | Set quantity + reason |
| `chat/[orderId]` · `notifications` | Supporting screens |

### Admin dashboard
Chrome ported from `worknow/admin-dashboard`: collapsible icon-rail sidebar with grouped nav and hover tooltips, sticky glass header with breadcrumbs + search + notification bell + account menu, CSS-variable light/dark theming.

| Route | Page |
|---|---|
| `/login` | Admin sign-in |
| `/dashboard` | Revenue, orders, pending, low-stock tiles + sales chart + recent activity |
| `/dashboard/products` · `/products/[id]` | Catalogue CRUD, image upload, pricing |
| `/dashboard/inventory` | Stock grid, low/out-of-stock filters, bulk adjust |
| `/dashboard/orders` · `/orders/[id]` | All orders, status filter, payment info, fulfilment |
| `/dashboard/customers` · `/customers/[id]` | Customers + order history |
| `/dashboard/attendants` | Create / activate / deactivate staff |
| `/dashboard/reports` | Sales, best-sellers, inventory, delivery performance |
| `/dashboard/notifications` · `/settings` | Broadcasts, store config, delivery pricing |

---

## 6. Build order

### Phase 0 — Foundation
- `[x]` `.npmrc` (`node-linker=hoisted`), root scripts, `.gitignore`
- `[x]` `packages/shared` — types, enums, brand, money, config, validation
- `[x]` `metro.config.js` per Expo app (monorepo watch folders)
- `[x]` Strip NativeWind from both mobile apps
- `[x]` Install real deps (`@expo/vector-icons`, `expo-haptics`, `expo-linear-gradient`, `expo-image`, `expo-secure-store`, `@supabase/supabase-js`, …)
- `[x]` Logo into `assets/` of all three apps
- `[x]` `.env.local` for all three apps with every key stubbed

### Phase 1 — Mobile design system
- `[x]` `src/theme/{theme.ts,ThemeProvider.tsx}` — light/dark tokens, persisted mode
- `[x]` `src/components/Glass.tsx` — `GlassCard`, `GlassButton`, `Entrance`, `useEntrance`
- `[x]` `src/components/Ui.tsx` — `Field`, `StatusPill`, `SectionHeader`, `Divider`, `DetailRow`
- `[x]` `Screen`, `ScreenHeader`, `EmptyState`, `Skeleton`, `Loading`, `Toast`, `QtyStepper`, `StickyBar`
- `[x]` `FloatingTabBar` 3-tab layout
- `[x]` Same system in `attendant-app` (ported whole, plus `Queue.tsx` and `Stock.tsx`)

### Phase 2 — Mobile auth + shell
- `[x]` `SessionProvider` on Supabase Auth with role gating (customer app)
- `[x]` Welcome / login / signup / forgot-password (customer app)
- `[x]` `(app)/_layout.tsx` auth guard + role guard
- `[x]` Demo bypass: with no Supabase keys the gate stands in the fixture profile so
  the whole app is walkable on a device for screenshots
- `[x]` Same for `attendant-app` (staff-only: no sign-up, wrong-app notice on the
  welcome and login screens when a customer account signs in)

### Phase 3 — Customer screens
- `[x]` Home, Orders, Account (tabs)
- `[x]` Search, Category, Product, Cart (`CartProvider`, persisted), Checkout, Order detail
- `[x]` Addresses, Notifications, Edit profile
- `[x]` `src/lib/data.ts` facade + `src/lib/demo.ts` fixtures so every screen renders
  before the API exists; `src/lib/uploads.ts` signed-URL prescription upload

### Phase 4 — Attendant screens
- `[x]` Queue (Active / Handed off / Done lanes, grouped by next action)
- `[x]` Order detail + fulfilment actions (pick-list gate, `ORDER_STATUS_FLOW`-derived
  next step, inline cancel with reason)
- `[x]` Inventory (debounced search, All / Low / Out) and Stock edit (absolute count,
  ± chips, movement reason, history)
- `[x]` Account, Notifications, Edit profile
- `[x]` `src/lib/data.ts` facade + `src/lib/demo.ts` fixtures, mutable so a status
  change or a stock correction survives navigation during a demo

### Phase 5 — Backend
- `[ ]` `supabase/schema.sql` + `policies.sql` + `seed.sql`
- `[ ]` `src/server/{supabase,auth,services/*}`
- `[ ]` Every route in §4
- `[ ]` Mobile `src/lib/api.ts` typed client, swap screens off mock data

### Phase 6 — Admin dashboard
- `[ ]` Theme provider + CSS variables + shell (sidebar, header, chrome)
- `[ ]` Login, Overview, Products, Inventory, Orders, Customers, Attendants, Reports, Settings

### Phase 7 — Integrations
- `[ ]` Payment provider (Paystack or Flutterwave) init + webhook signature verification
- `[ ]` `expo-notifications` push registration + server send
- `[ ]` Realtime subscriptions (order status, stock, chat)
- `[ ]` Delivery partner adapter behind an interface so the provider is swappable

### Phase 8 — Hardening
- `[ ]` Zod validation on every route body
- `[ ]` Rate limiting on auth + payment routes
- `[ ]` RLS verified per role
- `[ ]` EAS build profiles

---

## 7. Environment variables

`apps/customer-app/.env.local`, `apps/attendant-app/.env.local` — only `EXPO_PUBLIC_*` reaches the bundle, so nothing secret goes here.

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_ENV
```

`apps/admin-app/.env.local` — server-side, holds the secrets.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
PAYSTACK_SECRET_KEY / PAYSTACK_PUBLIC_KEY / PAYSTACK_WEBHOOK_SECRET
DELIVERY_PROVIDER / DELIVERY_API_KEY / DELIVERY_BASE_URL
GOOGLE_MAPS_API_KEY
STORE_LAT / STORE_LNG / DELIVERY_BASE_FEE_KOBO / DELIVERY_PER_KM_KOBO / DELIVERY_FREE_ABOVE_KOBO
EXPO_ACCESS_TOKEN
```

---

## 8. Verification

- `pnpm -r exec tsc --noEmit` — type-checks all three apps and the shared package
- `npx expo export -p android` in each mobile app — proves the bundle resolves with no missing imports
- `pnpm --filter admin-app build` — Next production build
- Expo Go on device: splash → welcome → login → 3-tab shell in both light and dark
- Manual: place an order end to end and watch it move through the attendant queue and the admin order list
