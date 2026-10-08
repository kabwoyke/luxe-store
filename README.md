# LUXESTORE

Kenyan beauty, fashion and wellness store. Next.js + Tailwind + MySQL + M-Pesa (Daraja).

## Local setup

1. `npm install`
2. Create the database and user: edit the password in `db/create-database.sql`, then run it in your local MySQL 8 / MariaDB 10.6+ (XAMPP, Laragon, WAMP, Workbench, or the `mysql` CLI).
3. Copy `.env.example` to `.env.local`, fill in values (make `DATABASE_URL` match the password you chose).
4. `npm run dev`

## Accounts

Auth.js (credentials, JWT session in an httpOnly cookie). Set `AUTH_SECRET` in `.env.local` (generate one with `npx auth secret` or `openssl rand -base64 32`) and keep `AUTH_URL` equal to the site URL. The first admin is created by the seed from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; everyone who signs up is a customer.

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
