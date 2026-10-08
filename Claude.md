# CLAUDE.md — LUXESTORE (Next.js rebuild)

Kenyan beauty, fashion and wellness e-commerce store. This is a **fresh rebuild** of an existing Vite + Express + SQLite app in Next.js + Tailwind. The old app is the reference for look, copy and behaviour, but its code is **not** to be copied over wholesale. Rebuild cleanly and keep the same theme.

If anything here conflicts with what the owner says in chat, the owner wins. Ask before making big decisions not covered here.

---

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (latest stable), App Router, TypeScript strict, `src/` dir |
| Styling | Tailwind CSS + shadcn/ui (Radix). Theme tokens below |
| Fonts | `next/font/google`: **Outfit** (display/headings), **Inter** (body) |
| Animation | framer-motion (light use: card fade-in, page sections) |
| Icons | lucide-react |
| Data fetching | Server Components by default. TanStack Query only for interactive client areas (admin) |
| Validation | zod, shared between route handlers and forms (react-hook-form + zodResolver) |
| Database | **MySQL 8** (InnoDB, `utf8mb4`) + Drizzle ORM (`drizzle-orm/mysql-core`, `mysql2` driver, `drizzle-kit` for migrations). Do not use SQLite, and do not use Postgres-only features. See "MySQL notes" in section 7 |
| Auth | Auth.js (credentials: email + password, bcrypt) with `isAdmin` on the user. Session cookie, httpOnly |
| Payments | **M-Pesa via Safaricom Daraja** (STK Push). See section 8 |
| Images | `next/image`. Product photos uploaded to object storage (Cloudinary / S3 / Vercel Blob). Never store base64 images in the database |
| Package manager | npm |

The owner will install the project first (`create-next-app`, shadcn init, deps) and then hand it to you. **Inspect what is already installed before adding anything.** Do not re-scaffold or overwrite their setup.

## 2. Working rules

- Build in small vertical slices (schema, API, UI, verify). After each slice run `npm run lint`, `npx tsc --noEmit`, and open the page in a browser to check it.
- Never claim something works without running it. Say what you tested and what you did not.
- Prefer editing existing files over creating new ones. No dead code, no TODO stubs left silently.
- Money is stored as **integer KES** (no decimals). Format with `Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 })`.
- Secrets live only in `.env.local`. Provide `.env.example` with empty values. Never commit real keys, cookies, DB files or admin passwords. The old zip contained `.env`, cookie dumps and `luxestore.db`: do not carry any of those over.
- Seed the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. Never hard-code credentials.
- Commit in logical steps with clear messages.

## 3. Theme (keep identical to the old store)

Look: soft, premium, feminine. Plum and mauve on blush-white, rounded cards, pill buttons, generous whitespace.

Palette (use as Tailwind theme colors / CSS variables, not scattered hex):

| Token | Hex | Use |
|---|---|---|
| `ink` | `#2d1a2d` | Headings, primary buttons, announcement bar, footer |
| `ink-hover` | `#46233d` / `#4d2b45` | Button hover |
| `mauve` | `#8f4464` | Accent: prices, active nav link, selected swatch ring, links |
| `mauve-dark` | `#6b3558` | Accent hover |
| `body` | `#5d4c56` | Body text, inactive nav links |
| `muted` | `#7b6070` / `#6e5160` | Small labels, captions |
| `border` | `#f0dfe8` / `#f3e3eb` | Card and divider borders |
| `blush` | `#fff0f6` | Soft section backgrounds, tab bars |
| `page` | `#fffafc` | Page / panel background |
| `warn` | `#c06b2a` | Low stock text |
| `gradient-cta` | pink to purple (`from-pink-500 to-purple-600`) | "Buy Now" and newsletter "Join" buttons only |

Rules:
- Radius: cards `rounded-[1.25rem]` (mobile) to `rounded-[1.6rem]` (sm+), buttons and inputs `rounded-full` or `rounded-xl`, panels `rounded-3xl`. Soft shadows like `shadow-[0_16px_40px_rgba(53,25,41,0.06)]`.
- Uppercase micro-labels: `text-[10px]–xs font-semibold uppercase tracking-[0.14em–0.25em]`.
- Logo: `LUXE` in `ink` + `STORE` in `#9b5e7a`, Outfit, bold, tight tracking.
- Announcement bar above header: ink background, white 11–12px text. Mobile shows the short text "Free delivery over KES 5,000 | M-Pesa checkout"; desktop shows "Free Delivery across Kenya on orders over KES 5,000 | Fast M-Pesa Checkout".
- Hero on home: dark plum gradient panel, rounded, with pink-tinted highlight text ("curated for you.").

## 4. Information architecture

Routes (App Router):

```
/                       Home (hero, category tiles, new arrivals, best sellers, collections, newsletter)
/shop                   All products + search + filters
/categories/[category]  Category listing with detail filters
/collections/[slug]     Curated collections (e.g. new-arrivals, the-hair-edit)
/products/[id]          Product details (use [id]; add slug later only if asked)
/search                 Search results
/wishlist
/checkout               Delivery details + M-Pesa payment
/order/[id]             Order status page (live payment status)
/profile                Account + order history
/about /contact /faq /shipping /returns /privacy /terms
/admin                  Dashboard (admin only)
/api/...                Route handlers (see section 7)
```

Main navigation (exact labels and targets):

| Label | Href |
|---|---|
| Home | `/` |
| Shop | `/shop` |
| Hair & Wigs | `/categories/Wigs` |
| Beauty & Makeup | `/categories/Cosmetics` |
| Shoes & Heels | `/categories/Shoes` |
| Handbags & Totes | `/categories/Handbags` |
| Jewelry & Accessories | `/categories/Accessories` |
| Self-Care & Wellness | `/categories/Wellness` |
| New Arrivals | `/collections/new-arrivals` |

Footer: brand blurb, quick links, policy links, newsletter signup.

## 5. Responsive requirements (hard requirements)

**Navbar**
- Two rows on desktop (`xl`, 1280px and up): row 1 = logo, search (flexible width), wishlist, cart, account/login. Row 2 = the nine category links in one centered line.
- Links must **never wrap**: `whitespace-nowrap`, fixed `gap-x-8`. The row also has `overflow-x-auto` with hidden scrollbar as a safety net.
- Below 1280px the row 2 is hidden and a hamburger opens a left slide-in sheet containing search, all links, wishlist, account and login. (In the old app the single-row nav wrapped to 2–3 lines and pushed cart/login off-screen at 1280px; do not repeat that.)
- Header is sticky. Cart opens as a right-side drawer.
- Mobile: logo + cart + hamburger only. Search lives inside the sheet.

**Whole site**
- Design mobile-first; verify at **375px, 768px, 1024px, 1280px, 1440px**.
- **No horizontal page scroll at any width.** Check `document.documentElement.scrollWidth <= clientWidth` on every page.
- Product grids are **2 columns on phones** (`grid-cols-2 gap-3`), 3 at `lg`, 4 at `xl`. Cards use a compact layout on mobile (square image, smaller type, full-width button).
- Tap targets at least 40px. Tabs and long chip rows scroll horizontally instead of wrapping awkwardly.
- Admin tables scroll horizontally inside their container; admin dialogs fit `w-[calc(100vw-1.5rem)]` on mobile.
- Filters collapse behind a "Filter by details" toggle on mobile, always visible on `lg`.

## 6. Product model: categories, attributes, colors and sizes

This is the core feature. Keep **one config file** (`src/lib/product-options.ts`) as the single source of truth for admin form, storefront, filters and search.

### 6.1 Product fields

`id, storeId, name, description, shortDescription?, price (int KES), category, subcategory, brand?, tags[], stock (int), imageUrl (main), images[] (default gallery), attributes {key: value}, colorImages {colorName: [urls]}, variants[], featured, bestSeller, newArrival, createdAt`

Variant: `{ id, color?, colorHex?, size?, stock, sku? }`.

Rules:
- `product.stock` must equal the **sum of variant stock** whenever variants exist. Compute it on the server on write, not in the client.
- A variant is unique per `(color, size)`. Adding an existing pair updates its stock.
- Order lines store `variantId`, and order views must show the readable label ("Honey Blonde / 18\"") and the colour's photo. (The old app lost `variantId` in order queries.)
- Store `brand`, `tags`, `images` properly. (The old app silently dropped them on save.)

### 6.2 Categories and types (subcategories)

- **Shoes**: General, Heels, Sneakers, Boots, Sandals, Flats, Loafers, Slides
- **Wigs**: General, Lace Front, Full Lace, Closure Wig, Frontal Wig, Glueless Wig, U-Part Wig, Bob Wig, Headband Wig, Bundles, Ponytail, Human Hair, Synthetic
- **Cosmetics**: General, Body Wash & Soaps, Skin Care, Hair Care, Makeup, Fragrance, Beauty Tools
- **Handbags**: General, Totes, Shoulder Bags, Clutches, Crossbody, Backpacks
- **Accessories**: General, Jewelry, Gold Hoops, Hair Clips, Sunglasses, Watches
- **Wellness**: General, Body Care, Self Care, Shower Infusions, Botanical Oils, Aromatherapy
- Also supported: Makeup, Skincare, Fragrance with their own types (Lips/Face/Eyes/Tools, Cleanser/Toner/Serum/Moisturizer/Sunscreen/Body Wash & Soaps, Perfume Oils/Body Mist/Gift Sets)

### 6.3 Per-category attributes (dropdowns in admin, shown as specs and filters on the storefront)

**Wigs / hair** (`filterable` = shown as storefront filter)
- `hairType` (filterable): Human Hair, Virgin Human Hair, Remy Human Hair, **Semi-Human Hair**, Synthetic
- `texture` (filterable): Straight, Body Wave, Loose Wave, Deep Wave, Water Wave, Natural Wave, Curly, Bouncy Curl, Kinky Curly, Kinky Straight, Jerry Curl
- `curly` (filterable): Yes / No. Auto-set from texture (Curly, Bouncy Curl, Kinky Curly, Jerry Curl = Yes) but admin can override
- `construction`: 4x4 Closure, 5x5 Closure, 6x6 Closure, 13x4 Frontal, 13x6 Frontal, 360 Lace, Full Lace, U-Part, Headband, No Lace
- `laceType`: HD Lace, Transparent Lace, Swiss Lace, French Lace, None
- `density` (filterable): 130%, 150%, 180%, 200%, 250%
- `glueless`: Yes / No
- `capSize`: Small, Average, Large
- **Size dimension = length in inches**: 8" to 36" in steps of 2 (label "Length (inches)")
- **Colors**: Natural Black, Jet Black, Dark Brown, Chestnut Brown, Honey Blonde, Platinum Blonde, Ginger, Auburn, Burgundy, Silver Grey, Pink, Ombre Brown, Ombre Blonde (ombres render as CSS gradients)

**Shoes**
- `material` (filterable): Leather, Faux Leather, Suede, Canvas, Satin, Mesh, Rubber
- `heelHeight` (filterable): Flat, Low (1-2 in), Mid (2-3 in), High (3-4 in), Platform
- `occasion` (filterable): Casual, Office, Party, Sports
- **Size = EU 35–46** ("Size (EU)")
- **Colors**: Black, White, Beige, Nude, Tan, Brown, Red, Pink, Navy, Green, Gold, Silver

**Handbags**
- `material` (filterable): Leather, Faux Leather, Canvas, Suede, Straw, Nylon
- `closure`: Zip, Magnetic Snap, Flap, Drawstring
- `strap`: Top Handle, Shoulder Strap, Crossbody Strap, Detachable Strap
- **Size**: Mini, Small, Medium, Large, Extra Large
- **Colors**: Black, Cognac Tan, Brown, Camel, Cream, White, Burgundy, Red, Pink, Navy, Green, Gold

Other categories (Cosmetics, Accessories, Wellness) use free-text size/shade variants. Allow a **custom colour** (name + colour picker hex) in every category.

### 6.4 Colour-driven product images (the key UX)

- Each colour owns its photos: `colorImages["Honey Blonde"] = [url, ...]`. First photo is the main one.
- **Product page**: a swatch row (round, 32px, ring in `mauve` when selected). Clicking a swatch immediately swaps the main image and the thumbnail gallery to that colour's photos (fade transition). Colours without photos fall back to the default gallery.
- Default selected colour = `?color=` query param if present, else first colour that is in stock.
- **Product card**: small swatch dots (max 5, then "+N"). Clicking a dot swaps the card image; the card link then carries `?color=` so the product page opens on that colour. Click again to reset.
- **Size/length picker** (pills) below the swatches. Sizes sold out for the selected colour are disabled and struck through; sold-out colours show a diagonal slash on the swatch. Changing colour keeps the chosen size only if that combination is in stock.
- **Add to cart and Buy Now require a complete selection** when the product has options. Otherwise show an inline "Please select a length/size" message plus a toast. Never add the base product silently.
- Show "Only N left in this option" when the selected variant has 5 or fewer.
- Cart drawer, checkout, order pages, profile and admin orders all show the **colour's photo** and the label `Color / Size`.
- **Dynamic, no reload.** Colour selection is client-side state. Clicking a swatch must not navigate or refetch: the main image, thumbnails, selected-colour label, available sizes, stock message and add-to-cart target all update instantly. Keep the URL in sync with `history.replaceState` (`?color=Black`) so the link can be shared and the back button is not polluted.
- **Preload.** When a product page or card mounts, preload the first photo of every colour (`new Image().src`, or `<link rel="preload">` for the default). A swap should never flash blank. Use a short cross-fade (about 200–300ms) and keep the image container a fixed aspect ratio so the layout does not jump.
- **Thumbnails** show only the selected colour's photos (several angles per colour). Selecting a thumbnail changes the main image. Switching colour resets to that colour's first photo. On mobile the gallery is swipeable with dot indicators.
- **Shoes specifically**: every colour has its own set of photos (ideally side view, front, sole, on-foot). Selecting Black shows only black-shoe photos, selecting Red only red-shoe photos. The size picker (EU 35–46) sits under the swatches and re-evaluates availability per colour, e.g. Black may be sold out in 41 while Beige is not. The same behaviour applies to handbags and wigs; build it once as a shared component (`ColorGallery` + `VariantPicker`) used for all three categories.
- Product page also shows highlight chips (wigs: hair type, texture, Curly / Not curly) and a specs table (all attributes, available colours, available sizes, brand).
- Product card subtitle shows highlights, e.g. `Human Hair • Body Wave • 18"–26"`.

### 6.5 Filters and search

- Category and shop pages build filter groups from the products on screen: Color (swatches), Length/Size (pills), plus every `filterable` attribute (hair type, texture, curly, density, material, heel height, occasion). OR within a group, AND between groups. Show an active-filter count and "Clear".
- Search must match name, description, category, subcategory, brand, tags, **all attribute values and variant colours/sizes**. Searching "curly" finds Curly = Yes wigs, "semi-human" finds semi-human hair.

### 6.6 Admin product form

- Choosing a category loads its attribute dropdowns, colour list and size options; changing category resets attributes and variant pickers.
- Variant builder: pick a colour (or Custom + hex), tap one or more sizes/lengths, set stock, "Add options" creates the whole colour x size set. Show variants as removable chips with a swatch.
- "Photos by colour" panel: one block per colour that has variants, with multi-file upload and "paste image URL". Upload to object storage and resize client-side (max ~1100px) first. Drop photos for colours that no longer have variants on save.
- Compact on mobile; dialog scrolls.

### 6.7 Demo seed

Seed realistic sample data so the feature is visible immediately: about 4 wigs (human body wave lace frontal, glueless straight closure, semi-human kinky curly U-part, synthetic bouncy curl bob), 2 shoes (sneakers, block-heel sandals), 2 handbags (tote, crossbody), each with 2–4 colours, sizes, uneven stock (include a sold-out combination) and images per colour. Give the shoes **at least 2 photos per colour** (e.g. side and front) so the thumbnail gallery and colour swap can be tested properly. Use placeholder illustrations until the owner uploads real photos. Seed script must be idempotent (skip by name).

## 7. Data model and API

Tables: `users` (id, email, passwordHash, firstName, lastName, isAdmin), `stores` (id, name, slug, color, isActive), `products` (above), `collections` (id, name, slug, description, productIds), `reviews` (id, productId, userName, rating, comment, createdAt), `orders`, `order_items`, `inventory_logs`, `newsletter_subscribers`, `payments` (see section 8).

Orders: `id, userId, storeId, status (pending|paid|shipped|delivered|cancelled), total, paymentMethod (mpesa|card), paymentStatus (pending|paid|failed|cancelled), deliveryName, deliveryPhone, deliveryAddress, createdAt`. Order item: `orderId, productId, variantId, quantity, price (snapshot)`.

Multi-store: the old app had stores (e.g. "Main Shoes", "Luxe Wigs") and `storeId` on products and orders. Keep `storeId`, but do not build store-switching UI unless asked.

**MySQL notes**
- Env: `DATABASE_URL=mysql://user:password@host:3306/luxestore`. Create the database with `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`. All tables InnoDB.
- Create one shared `mysql2` pool (`createPool`, `connectionLimit` about 10; keep it small on serverless hosts) in `src/db/index.ts`, cached on `globalThis` in dev so hot reload does not open new pools.
- IDs: `int` auto-increment primary keys (`serial` is `bigint unsigned`, avoid it so foreign keys stay `int`). Money: `int` KES.
- Flexible fields use the native **`json`** column type: `products.images` (string[]), `products.tags` (string[]), `products.attributes` (object), `products.colorImages` (object), `products.variants` (array), `collections.productIds` (number[]). MySQL `json` columns cannot take a plain literal default, so set `[]` / `{}` in application code (Drizzle `.$defaultFn`), not in the DDL. To filter by attribute in SQL use `JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.hairType'))`; for the storefront it is fine to fetch and filter in code at this catalogue size. If the catalogue grows large, add generated columns (e.g. `hair_type`, `texture`, `curly`) with indexes.
- Long text (`description`) is `text`. Short strings are `varchar(n)` with sensible limits (name 255, slug 191 and unique, email 191 and unique). Timestamps use `timestamp`/`datetime` with `defaultNow()`; store and compare in UTC and format to Africa/Nairobi in the UI.
- Add indexes on `products(category, subcategory)`, `products.name`, `orders(userId)`, `order_items(orderId)`, `payments(checkoutRequestId)` (unique), `payments(orderId)`.
- Enum-like fields (`status`, `paymentStatus`, `paymentMethod`) are `varchar` validated by zod, not MySQL `enum`, so adding a value never needs an `ALTER`.
- Every order, payment-callback and stock write runs inside `db.transaction`. When deducting stock, lock the product row first (`select ... for update`) so two simultaneous payments cannot oversell. Variants live inside the product's JSON, so read, modify and write them within that same locked transaction.
- Migrations: `drizzle-kit generate` then `drizzle-kit migrate`, committed to the repo. Never edit the production schema by hand. Seed scripts must be idempotent.
- Backups: tell the owner to enable automated daily backups on whatever MySQL host is used (cPanel, DigitalOcean, Aiven, TiDB, PlanetScale). **Do not use Docker anywhere in this project**: no Dockerfile, no docker-compose, no container instructions. Local development uses a natively installed MySQL 8 (or MariaDB 10.6+ / XAMPP / Laragon / WAMP / MySQL Workbench setup) that the owner already runs. The `README` explains how to create the database and user with plain SQL.

Route handlers: products (list/get public; create/update/delete admin), orders (create + list/get for the session user; status update admin), collections, reviews, search, newsletter, analytics (sales, inventory), admin users, admin CSV export, settings. All admin routes check `isAdmin` server-side. All inputs validated with zod.

Order creation (server, in one DB transaction):
1. Re-fetch products and variants from the DB. **Never trust client prices.**
2. Reject if any line's variant is missing or `quantity > variant.stock`.
3. Create order (`pending`) and items with snapshot prices. Do **not** deduct stock until payment is confirmed (or reserve with expiry; see section 8).
4. Return the order id; the client then starts payment.

Admin dashboard: Overview (revenue, orders, inventory totals, low stock, sales by category, CSV export), Products (table + dialog above), Orders (table with an **Items column showing qty x name (Color / Size)**, status update), Customers, Settings. The old OverviewTab called a hook after an early return, which crashes with "Rendered more hooks than during the previous render". Put all hooks before any conditional return.

Review form: field name is `userName` in API and form (the old form sent `authorName` and failed).

## 8. Payments: M-Pesa via Daraja (STK Push)

Use Safaricom **Daraja** "Lipa Na M-Pesa Online" (STK Push). Implement server-side only. Never expose keys to the client. (If the owner confirms a different aggregator is wanted, keep the payment layer behind an interface so it can be swapped.)

Env vars:
```
MPESA_ENV=sandbox            # sandbox | production
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=174379       # sandbox default; real paybill/till in production
MPESA_PASSKEY=
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline   # or CustomerBuyGoodsOnline for a Till
MPESA_CALLBACK_URL=https://<public-host>/api/mpesa/callback
```
Base URLs: sandbox `https://sandbox.safaricom.co.ke`, production `https://api.safaricom.co.ke`.

Flow:
1. **Token**: `GET /oauth/v1/generate?grant_type=client_credentials` with Basic auth (`key:secret` base64). Cache the token in memory until about 5 minutes before it expires (about 3599s).
2. **Initiate**: `POST /api/mpesa/stkpush` (authenticated). Body `{ orderId, phone }`. Server loads the order, verifies it belongs to the user, is `pending`, and uses the **order total from the DB**. Normalize the phone to `2547XXXXXXXX` (accept `07…`, `01…`, `+254…`, `254…`; reject everything else). Then call `POST /mpesa/stkpush/v1/processrequest` with:
   - `BusinessShortCode`, `Password = base64(Shortcode + Passkey + Timestamp)`, `Timestamp = YYYYMMDDHHmmss` (East Africa time is fine, be consistent)
   - `TransactionType`, `Amount` (integer KES), `PartyA` = phone, `PartyB` = shortcode (Till number for Buy Goods), `PhoneNumber` = phone
   - `CallBackURL`, `AccountReference` = `LUXE-<orderId>`, `TransactionDesc`
   Store a `payments` row: `orderId, merchantRequestId, checkoutRequestId, phone, amount, status (pending), resultCode, resultDesc, mpesaReceipt, createdAt`.
3. **Callback**: `POST /api/mpesa/callback` (public, no session). Parse `Body.stkCallback` (`MerchantRequestID`, `CheckoutRequestID`, `ResultCode`, `ResultDesc`, `CallbackMetadata.Item[]` with `Amount`, `MpesaReceiptNumber`, `TransactionDate`, `PhoneNumber`). Match by `CheckoutRequestID`. `ResultCode === 0` means success. Be **idempotent**: if the payment is already final, return 200 and do nothing. On success, in one transaction: mark payment `paid`, order `paid`, deduct variant stock and product stock, write `inventory_logs`. On failure or cancel (e.g. 1032 cancelled, 1 insufficient funds, 2001 wrong PIN, 1037 timeout): mark `failed`/`cancelled`, keep the order `pending` so the customer can retry. Always respond `{"ResultCode":0,"ResultDesc":"Accepted"}`. Verify the received amount equals the order total. Log raw callback bodies for debugging (no secrets).
4. **Status polling**: `GET /api/orders/[id]/payment` returns the payment status. The checkout/order page polls every 3s for up to about 90s showing "Check your phone and enter your M-Pesa PIN". If still pending, call **STK Query** (`POST /mpesa/stkpushquery/v1/query` with `CheckoutRequestID`) from the server to reconcile in case the callback was missed. Then offer "Resend prompt" and "Pay with a different number".
5. **Stock safety**: prevent overselling. Either re-check stock inside the callback transaction (and mark the order for manual review/refund if stock is gone) or reserve stock with a 10-minute expiry at order creation. Pick one and document it.
6. **Security**: only the callback route is public. Validate its shape with zod, ignore unknown `CheckoutRequestID`s, and rate-limit the initiate route. Optionally restrict the callback to Safaricom IPs in production and add an unguessable token to the callback URL path or query.
7. **Local dev**: Daraja needs a public HTTPS callback URL. Use a tunnel (ngrok/cloudflared) and set `MPESA_CALLBACK_URL`. Sandbox test number `254708374149` (sandbox PIN prompts are simulated). Document this in the README.
8. Later (not now unless asked): B2C refunds, C2B register URL, transaction reversal, receipts by email/SMS.

Checkout UI: delivery details (name, phone, county/town, address, notes), order summary with colour photos and labels, delivery fee rule (free over KES 5,000), M-Pesa phone field (prefilled from delivery phone), "Pay with M-Pesa" button, then a waiting state, then success or failure state. The `card` option stays disabled with a "Coming soon" label.

## 9. Content and copy

- Currency KES; locale `en-KE`. Phone examples use +254.
- Tone: warm, confident, concise. Brand line: "Your everyday luxury, curated for you." Tagline chip: "Beauty • Fashion • Wellness".
- Policies pages (shipping, returns, privacy, terms, FAQ, about, contact) are real pages with sensible Kenya-specific content; keep them editable as plain TSX/MDX.
- Free delivery across Kenya over KES 5,000.

## 10. Implementation phases

Work **one phase at a time, in order**. Do not start a phase until the previous one is approved. At the end of each phase:
1. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
2. Run the app and check the phase's exit checks below in a real browser (at 375px and 1280px at minimum).
3. Commit the phase.
4. Post a short summary: what was built, what was tested and how, what was not tested, and any decision the owner must make.
5. **Stop and wait for the owner to say "continue".** Do not roll into the next phase on your own.

Keep a `PROGRESS.md` in the repo root: one line per phase with status (todo / in progress / done) and open questions. Update it at every stop.

### Phase 0: Setup check
- Inspect what the owner already installed (Next.js version, Tailwind, shadcn, deps). Add only what is missing: drizzle-orm, drizzle-kit, mysql2, zod, react-hook-form, @hookform/resolvers, framer-motion, lucide-react, bcryptjs, next-auth (Auth.js), @tanstack/react-query.
- Create `.env.example`, `README.md` skeleton, `PROGRESS.md`, and a `db/create-database.sql` file (create database with utf8mb4, create user, grant privileges) the owner can run in their local MySQL. No Docker files.
- Exit: `npm run dev` starts; the app connects to the owner's local MySQL using `DATABASE_URL`.

### Phase 1: Foundations and layout
- Theme tokens (section 3), Outfit + Inter fonts, global styles.
- Announcement bar, sticky responsive navbar (section 5), footer, right-side cart drawer shell, mobile menu sheet.
- Exit: navbar never wraps at 1280 / 1440 / 1920; hamburger works below 1280; no horizontal scroll at 375 / 768 / 1024 on the empty layout.

### Phase 2: Database and catalogue data
- Drizzle schema for all tables (section 7), MySQL notes applied, first migration.
- `src/lib/product-options.ts` with every category, attribute, colour and size from section 6, plus helpers (colour CSS lookup, gallery for a colour, variant lookup, card highlights, search text).
- Idempotent seed: admin from env vars, stores, collections, demo catalogue (section 6.7) with colour placeholder illustrations.
- Exit: `drizzle-kit migrate` and seed run cleanly on an empty database and a second seed run adds nothing; product stock equals the sum of variant stock.

### Phase 3: Storefront browsing
- Home, shop, category, collection, search pages; product card with swatches that swap the image; 2-column mobile grids.
- Attribute filters and the search rules from section 6.5.
- Exit: searching "curly", "semi-human", "body wave" and a colour name returns the right products; filters combine correctly; swatch click on a card swaps its image; no overflow at 375px on any page.

### Phase 4: Product page, cart and wishlist
- Product page: colour-driven gallery, size/length picker, sold-out handling, highlight chips, specs table, reviews, tabs that scroll on mobile.
- Cart keyed by product + variant (localStorage), cart drawer showing the colour photo and `Color / Size`, wishlist.
- Add to cart and Buy Now blocked until the selection is complete.
- Exit: on a wig, a shoe and a bag, picking a colour swaps photos instantly with no page reload or blank flash, thumbnails show only that colour's photos, the URL gains `?color=`, sold-out combinations are disabled, the cart shows the right photo and label. On a shoe, switching colour re-checks which EU sizes are available.

### Phase 5: Accounts and orders
- Auth.js credentials login and signup, `isAdmin` flag, profile page, protected routes.
- Order creation endpoint with the server-side checks from section 7 (re-fetch prices, validate variant and stock, snapshot prices, transaction). Order page and profile order history with colour photo and label.
- Exit: a non-admin cannot reach admin routes or APIs; tampering with a price in the request has no effect; an out-of-stock variant is rejected.

### Phase 6: Checkout and M-Pesa (Daraja)
- Checkout form and summary, then the full Daraja flow in section 8: token cache, STK Push initiate, public callback (idempotent), status polling with STK Query reconciliation, retry and "different number" paths.
- Needs the owner's Daraja sandbox keys and a public tunnel URL. If these are missing, stop and ask; do not fake the integration.
- Exit: a sandbox payment turns the order `paid` and deducts stock exactly once, even when the callback is delivered twice; a cancelled or failed prompt leaves the order retryable; wrong amounts are rejected.

### Phase 7: Admin dashboard
- Overview analytics and CSV export, orders table with the Items column and status updates, customers, settings.
- Product management: table plus form with spec dropdowns, colour x size builder, photos per colour (upload to object storage), custom colours, server-computed stock.
- No hook-after-early-return bugs; tables scroll inside their container on mobile.
- Exit: create a wig as admin with two colours and three lengths plus colour photos, then see it on the storefront with working swatches; edit and delete work; mobile admin is usable at 375px.

### Phase 8: Content, SEO and polish
- About, contact, FAQ, shipping, returns, privacy, terms. Newsletter signup. 404 and error pages.
- Metadata and Open Graph per page, sitemap, robots, product JSON-LD, accessibility pass (labels, focus, contrast, keyboard use of swatches and pickers), image optimisation, loading skeletons.
- Exit: Lighthouse mobile at or above 90 for performance and accessibility on home and a product page, or a written list of what blocks it.

### Phase 9: Hardening and launch
- Rate limiting on auth and payment routes, security headers, error logging, production env checklist, MySQL backup note, deploy guide for the owner's host, switch Daraja from sandbox to production steps.
- Final verification: all five widths on every route, a full purchase in the Daraja sandbox, a fresh clone setup following only the README.
- Exit: the Definition of done in section 11 is fully met.

## 11. Definition of done

- `npm run build`, `npm run lint` and `npx tsc --noEmit` all pass.
- No horizontal overflow at 375 / 768 / 1024 / 1280 / 1440 on any route.
- Navbar links never wrap at any desktop width.
- On a wig, shoe and bag: clicking a colour swaps the image on both card and product page; sold-out combinations are disabled; add-to-cart is blocked until the selection is complete; cart and order pages show the right photo and label.
- Search for "curly", "semi-human", "body wave" and a colour name returns the right products.
- A sandbox M-Pesa payment completes: order becomes `paid`, stock decreases once (even if the callback is delivered twice), and a failed or cancelled prompt leaves the order retryable.
- Admin routes and APIs reject non-admins server-side.
- `drizzle-kit migrate` runs cleanly on an empty MySQL 8 database, and the seed runs twice without duplicating data.
- `.env.example` and README (native MySQL setup with plain SQL, migrate, seed, tunnel for callbacks, deploy notes) are up to date.