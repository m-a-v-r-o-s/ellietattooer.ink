# Shop / Checkout setup

The shop sells two products, both prices tax-inclusive, via **Stripe
Checkout**, hosted on **Railway**:

- **Backpiece Print 50×70cm** — €70, single size.
- **Oversized T-Shirt** — €35, sizes XS/S/M/L/XL.

Product config (price, sizes, stock) lives in `lib/shop.ts`.

## How it works

- **Inventory:** only the print is stock-limited — 3 total, tracked (not
  shown on the page). Each paid order is tagged in Stripe; before every
  checkout the server tallies paid units. At 3 the print flips to
  **SOLD OUT** automatically. No database — Stripe is the source of truth.
  The tally is cached briefly (60s for the page's own check, 5s for
  checkout) so a burst of traffic can't hammer the Stripe API. The t-shirt
  has no stock limit.
- **Per order:** up to **1** print, up to **10** t-shirts (per size), never
  more of the print than what's left.
- **Cart:** can mix both products; each line is priced and capped
  server-side from `lib/shop.ts`, never from what the client sends.
- **Shipping:** Greece only, 5 zones (`lib/shop.ts`), prices include 24% VAT.
  Choosing **Outside Greece** hides checkout and shows a "DM on Instagram" link.
- **After payment:** customer returns to `/?checkout=success`, the cart clears
  and a confirmation banner shows. Cancels return to `/?checkout=cancel`.

## Go live (once you have a Stripe account)

1. Create a Stripe account: https://stripe.com
2. Copy your **secret key** from https://dashboard.stripe.com/apikeys
   (use **Test mode** first — key starts with `sk_test_`).
3. In **Railway → your service → Variables**, add:
   - `STRIPE_SECRET_KEY = sk_test_...`
   - `NEXT_PUBLIC_SITE_URL = https://ellietattooer.com` — set this. It controls
     where buyers land after paying, and it is deliberately not read from the
     request headers (those are forgeable).
4. Redeploy. Done — the shop is live.

When ready for real sales, switch Stripe to **Live mode**, copy the
`sk_live_...` key, and replace `STRIPE_SECRET_KEY` on Railway.

## Test it (Test mode)

Buy the print and at Stripe's page use card **4242 4242 4242 4242**, any future
expiry, any CVC, any Greek address. After paying you'll land back on the site
with the confirmation banner. Make 3 test purchases and the card shows SOLD OUT
(allow up to a minute for the badge to catch up — the count is cached).

## Orders & notifications

Paid orders (with the buyer's shipping address) appear in your
**Stripe Dashboard → Payments**. To get an email on every sale, enable it in
**Stripe → Settings → Notifications**. Stripe also emails the buyer a receipt.

There's also a lightweight orders view built into the site itself, at
**`/admin/orders`** — a read-only table (date, customer, items, shipping
address, total), newest first, with an "Older orders" link to page back
through history. No separate database; it reads straight from Stripe
Checkout Sessions.

It's protected by HTTP Basic Auth. In **Railway → Variables**, add:
- `ADMIN_USER = ...`
- `ADMIN_PASSWORD = ...` (pick a real password)

Without both set, `/admin/orders` returns 503 rather than opening
unprotected. The page is also excluded from search indexing.

## Railway notes

- Build command: `npm run build` · Start command: `npm run start`
- Railway sets `PORT` automatically; `next start` uses it.
- Required env var: `STRIPE_SECRET_KEY` (see `.env.example`).
