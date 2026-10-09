# LUXESTORE

Kenyan beauty, fashion and wellness store. Next.js + Tailwind + MySQL + M-Pesa (Daraja).

## Local setup

1. `npm install`
2. Create the database and user: edit the password in `db/create-database.sql`, then run it in your local MySQL 8 / MariaDB 10.6+ (XAMPP, Laragon, WAMP, Workbench, or the `mysql` CLI).
3. Copy `.env.example` to `.env.local`, fill in values (make `DATABASE_URL` match the password you chose; set `AUTH_SECRET` to a random string of 32+ characters and `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the first admin).
4. `npm run db:migrate` to create the tables, then `npm run db:seed` to add the admin, stores, demo catalogue and collections.
5. `npm run dev`, then open http://localhost:3000. M-Pesa stays off until the `MPESA_*` values are filled in (see below).

## Accounts

Auth.js (credentials, JWT session in an httpOnly cookie). Set `AUTH_SECRET` in `.env.local` (generate one with `npx auth secret` or `openssl rand -base64 32`) and keep `AUTH_URL` equal to the site URL. The first admin is created by the seed from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; everyone who signs up is a customer.

## Content, SEO and contact

- **Information pages** (About, Contact, FAQ, Delivery, Returns, Privacy, Terms) are plain TSX in `app/<page>/page.tsx`: edit the wording there. The delivery fee and free-delivery threshold in them come from Admin > Settings. Have the privacy policy, terms and returns policy reviewed to match how you actually operate.
- **Contact details** (support email, phone, WhatsApp, address) are set in Admin > Settings and show on the contact page and in the footer. Messages from the contact form appear in Admin > Messages.
- **SEO:** every page has its own title, description and social preview. `NEXT_PUBLIC_SITE_URL` (defaults to `AUTH_URL`) must be the real public address in production, because canonical links, `/sitemap.xml` and `/robots.txt` are built from it. Product pages carry Product, price and rating structured data, and the FAQ carries FAQPage data. Checkout, accounts, search results and the admin are marked noindex.

## Admin dashboard

Log in with the seeded admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) and open `/admin`: Overview (revenue, orders, stock, low stock, revenue by category, CSV exports), Products (create, edit, delete with colour x size options and photos per colour), Orders (items with `Color / Size`, status updates), Customers and Settings (delivery fee, free-delivery threshold, low-stock warning). Admin pages and every `/api/admin/*` route re-check the admin flag in the database on each request.

Product photos: the browser shrinks each photo to at most 1100px, then the server saves it through `lib/storage.ts` and the database keeps only the URL.

- **Cloudinary (recommended, and required on serverless hosts such as Vercel):** set `CLOUDINARY_URL` (the `cloudinary://KEY:SECRET@CLOUD_NAME` value from your Cloudinary dashboard, under Settings > API Keys) or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `.env.local`, then restart. Uploads are signed on the server, so the secret never reaches the browser, and go to the `luxestore` folder (change it with `CLOUDINARY_FOLDER`). The shop requests each photo from Cloudinary at the size and format the visitor needs. Admin > Settings shows which storage is active.
- **Local disk (default when no Cloudinary keys are set):** photos go to `uploads/` (or `UPLOAD_DIR`) and are served at `/uploads/<random>.jpg`. Fine for development or a server with a persistent disk; back the folder up with the database. Photos already uploaded locally keep working after you switch to Cloudinary.

Pasted image links are shown as-is. Removing a photo in the admin does not delete it from Cloudinary.

Migrations: after editing `db/schema.ts` run `npm run db:generate` (it also forces `ENGINE=InnoDB` on new tables) and then `npm run db:migrate`.

## Database

```
npm run db:migrate   # applies db/migrations to DATABASE_URL
npm run db:seed      # admin (ADMIN_EMAIL / ADMIN_PASSWORD), stores, demo catalogue, collections
npm run db:generate  # after editing db/schema.ts, creates a new migration
```

The seed is idempotent: running it again adds nothing. Demo product photos are temporary Unsplash stock photos in `public/products` (see `CREDITS.md`). Each product uses one shared photo set for all its colours until real per-colour photos are uploaded.

**MySQL must use InnoDB.** Orders and payments rely on transactions and row locks. Some local installs (WAMP in particular) default to MyISAM, so the migration says `ENGINE=InnoDB` explicitly and `npm run db:seed` refuses to run if any table is not InnoDB. Timestamps are stored in UTC (each connection sets `time_zone = '+00:00'`) and shown in Africa/Nairobi.

## M-Pesa (Daraja STK Push)

Server-side only; keys never reach the browser. Fill these in `.env.local` (see `.env.example`):

| Variable | Notes |
|---|---|
| `MPESA_ENV` | `sandbox` or `production` |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` | From your Daraja app |
| `MPESA_SHORTCODE` | `174379` in the sandbox; your paybill or store number in production |
| `MPESA_PASSKEY` | From the Daraja "Lipa Na M-Pesa Online" simulator page / your go-live email |
| `MPESA_TRANSACTION_TYPE` | `CustomerPayBillOnline`, or `CustomerBuyGoodsOnline` for a Till |
| `MPESA_PARTY_B` | Optional. The Till number for Buy Goods; defaults to the shortcode |
| `MPESA_CALLBACK_URL` | Public HTTPS URL, e.g. `https://abc.ngrok-free.app/api/mpesa/callback?token=VALUE` |
| `MPESA_CALLBACK_SECRET` | The same `VALUE` as the `token` in the callback URL. Requests without it get 403 |

Until the keys are set, starting a payment returns "M-Pesa payments are not available yet" and the server log names the missing variables.

Local development: Daraja must reach your machine, so run a tunnel (`ngrok http 3000` or `cloudflared tunnel --url http://localhost:3000`) and put its HTTPS address in `MPESA_CALLBACK_URL`. Sandbox test phone: `254708374149`.

Endpoints:

- `POST /api/mpesa/stkpush` `{ orderId, phone }` (signed in): sends the prompt. The amount is read from the order, never from the request. Limited to 5 attempts a minute per user.
- `POST /api/mpesa/callback` (public, token-protected): records the result. Safe to deliver twice: the payment row is locked and anything already final is ignored.
- `GET /api/orders/[id]/payment` (owner or admin): payment status for polling every ~3s. If a prompt has been pending 20s or more it also runs an STK Query, so a missed callback is still reconciled.

Receipts: when a payment is confirmed the customer's browser downloads a PDF receipt automatically (once per device), and the order page keeps a "Download receipt" button. The data itself is recorded by the system in the `payments` table (M-Pesa receipt number, amount, phone, status, result) and the `orders` table; the PDF is rendered from it on demand at `GET /api/orders/[id]/receipt`. A payment confirmed through STK Query has no M-Pesa receipt number, so the receipt shows `LUXE-` plus the payment id until a late callback supplies it.

Going live: `MPESA_ENV=production` sends real prompts that charge real money. Production also requires `MPESA_CALLBACK_SECRET`, and `MPESA_CALLBACK_URL` must be HTTPS and end in `/api/mpesa/callback`; the app refuses to start a payment otherwise. A tunnel URL (ngrok) changes whenever it restarts, so update `MPESA_CALLBACK_URL` each time and restart the dev server.

Stock safety: stock is not reserved at order time. It is re-checked and deducted inside the payment-confirmation transaction with the product rows locked. If the money arrives but the stock is gone, the payment is marked `paid`, the order stays `pending`, and an inventory log entry starting `needs-review` is written. An order with `paymentStatus = paid` and `status = pending` therefore means "refund or restock".

## Security and going live

What protects payments:

- **Callback**: public, but needs the `?token=` secret (constant-time compare), must pass zod validation, must name a `CheckoutRequestID` we issued **and** the matching `MerchantRequestID`, is size-capped (10 KB) and rate-limited per IP. The paid amount must equal the order total. A receipt number that already paid something else is refused (`payments.mpesa_receipt` is unique). Optional IP allow-list: `MPESA_CALLBACK_ALLOWED_IPS`.
- **Initiate** (`POST /api/mpesa/stkpush`): signed-in owner of a pending order only; amount comes from the database; 5 attempts a minute per user; a second tap within 30 s reuses the prompt already sent instead of sending another.
- **Rate limits** (per server process, in memory): login 10 attempts / 15 min per email and 30 / 15 min per IP, sign-up 5 / hour per IP, orders 10 / 10 min per user, payment polling 60 / min per user, contact, newsletter and reviews 5 / 10 min per IP. Behind several instances, move this to a shared store (Redis).
- **Admin**: every `/api/admin/*` route re-checks `isAdmin` in the database. `Admin > Payments` can re-check a pending payment with Daraja and mark a payment paid by hand (needs the M-Pesa receipt code; stock is deducted once).
- **Headers**: HSTS, `nosniff`, `X-Frame-Options: DENY`, strict referrer policy, restricted Permissions-Policy, and a CSP covering framing, plugins, `<base>` and form targets. A full `script-src` CSP needs per-request nonces and is not set. `/api/admin`, `/api/mpesa` and `/api/orders` responses are `no-store`.
- **Start-up check** (`instrumentation.ts`): a production build refuses to start when `AUTH_SECRET` is under 32 characters, the callback URL is not HTTPS or lacks the token, or `MPESA_CALLBACK_SECRET` is under 24 characters. It warns about localhost/tunnel URLs and a missing Till number. Unhandled server errors are logged as `[error] METHOD /path ... digest=...`.

### Till (Buy Goods) settings

```
MPESA_ENV=production
MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline
MPESA_SHORTCODE=<store / head-office number from the Daraja go-live email>
MPESA_PARTY_B=<your Till number>
MPESA_PASSKEY=<production passkey from the go-live email>
```

With `CustomerPayBillOnline` and a Till number, Daraja rejects the request or the money goes nowhere useful, so the type must match how you were onboarded.

### Switching from sandbox to production

1. Complete Daraja "Go Live" for your Till; keep the production consumer key/secret, store number and passkey.
2. Put the values above in the host's environment (never in git). Set `MPESA_CALLBACK_URL=https://YOUR-DOMAIN/api/mpesa/callback?token=SECRET` and `MPESA_CALLBACK_SECRET=SECRET` (24+ random characters, e.g. `openssl rand -hex 24`).
3. Deploy, then make **one real payment of the cheapest item** and confirm: the order turns `paid`, stock drops by the right amount once, `Admin > Payments` shows the receipt and date, and the PDF receipt downloads.
4. Only then enable `MPESA_CALLBACK_ALLOWED_IPS` if you want it, and repeat the test payment.

### Production checklist

- [ ] `.env.local` is not in git (it is ignored); secrets live in the host's environment settings. Rotate the Daraja consumer secret and passkey if they were ever shared or pasted anywhere.
- [ ] `AUTH_SECRET` is a fresh 32+ character random value and `AUTH_URL` is the real `https://` address; `NEXT_PUBLIC_SITE_URL` is set.
- [ ] `ADMIN_PASSWORD` was strong when the admin was seeded; change it after first login.
- [ ] `MPESA_CALLBACK_URL` is your domain, not an ngrok address.
- [ ] `npm run db:migrate` has been run on the production database; the DB user has only the privileges in `db/create-database.sql`.
- [ ] **MySQL backups**: turn on automated daily backups at your MySQL host and do one test restore. Also take a manual dump before every deploy that includes a migration (`mysqldump --single-transaction luxestore > backup.sql`).
- [ ] Product photos use Cloudinary (local disk uploads vanish on most hosts).
- [ ] HTTPS everywhere, and the host forwards the client address in `X-Forwarded-For` (rate limits and the IP allow-list depend on it).

### Deploying

Any Node 20+ host that can run a long-lived server works (a VPS, cPanel Node app, Render, Railway). Build and run with `npm ci && npm run build && npm run db:migrate && npm start`, behind HTTPS. Set the environment variables from `.env.example` in the host's panel. Vercel-style serverless hosts also work but the in-memory rate limits and token cache then apply per instance, and the MySQL pool should be kept small.
