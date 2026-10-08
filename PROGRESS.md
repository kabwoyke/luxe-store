# Progress

| Phase | Status | Notes / open questions |
|---|---|---|
| 0 Setup check | done | No src/ (owner choice): app, components, lib, db at repo root. WAMP MySQL 8.4 on port 3306 |
| 1 Foundations and layout | done | Footer newsletter form posts to /api/newsletter, which does not exist until Phase 8. Account icon links to /profile (built in Phase 5) |
| 2 Database and catalogue data | done | Order items also store name, variant label and image snapshots; orders also store delivery county, notes and fee. Seed admin: ADMIN_EMAIL and ADMIN_PASSWORD in .env.local |
| 3 Storefront browsing | done | Demo photos are Unsplash stock (public/products, one shared set per product), so colour swaps change nothing visually until real per-colour photos are uploaded. Unknown category or collection URLs show the 404 page but return HTTP 200 (streaming); fix in Phase 8 SEO pass. Card button is "Choose options" until the cart exists (Phase 4). Newsletter API was built early |
| 4 Product page, cart, wishlist | done | Buy Now goes to /checkout, which 404s until Phase 6. Colour-photo swap was tested with temporary per-colour photos; demo data shares one photo set per product. Catalogue cache refreshes about 1 minute after DB edits |
| 5 Accounts and orders | done | Delivery fee assumed: KES 300 under KES 5,000 (lib/pricing.ts), owner to confirm. Pages for another user's order or non-admin show 404 content with HTTP 200 (streaming); data does not leak. /admin is a guard plus placeholder until Phase 7 |
| 6 Checkout and M-Pesa | done (real payment untested) | Checkout form, payment panel (waiting, retry, different number, timeout recovery) and PDF receipts built and tested against a mock Daraja. Credentials verified with a read-only production token request. Owner must run one real payment on a cheap item to confirm the live callback reaches the app. Env is MPESA_ENV=production (real money). Stock policy: re-check and deduct under row lock; paid-but-out-of-stock keeps order pending for review |
| 7 Admin dashboard | done | Photos use Cloudinary when CLOUDINARY_* keys are set (owner chose Cloudinary; driver tested against a mock, not yet with real keys), else local disk. Cancelling a paid order does not restock or refund yet. Settings drive the delivery rule (announcement bar, cart, product page, checkout, order totals) |
| 8 Content, SEO, polish | todo | |
| 9 Hardening and launch | todo | |
