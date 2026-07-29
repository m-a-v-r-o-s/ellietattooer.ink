import { getStripe, getSoldCountCached } from "@/lib/stripe";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  PRODUCT,
  TOTAL_STOCK,
  MAX_PER_ORDER,
  SHIPPING_ZONES,
} from "@/lib/shop";

export const runtime = "nodejs";

/**
 * The public origin is fixed configuration and is NEVER derived from the
 * request.
 *
 * `Origin` and `Host` are attacker-controlled on a direct POST — no browser is
 * involved, so nothing constrains them. They feed success_url, cancel_url and
 * the product image on Stripe's hosted page, which meant anyone could mint a
 * genuine checkout.stripe.com link for this shop that showed an image of their
 * choosing and sent the buyer to their domain the moment payment succeeded.
 * Textbook payment-confirmation phishing, hosted on real Stripe, paid to us.
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ellietattooer.com"
).replace(/\/+$/, "");

// A real buyer creates one session, maybe a few if they change their mind.
const CHECKOUT_LIMIT = 10;
const CHECKOUT_WINDOW_MS = 5 * 60_000;

// Checkout is the authoritative stock gate, so it wants a near-live count —
// short enough to be current, long enough to absorb a burst.
const CHECKOUT_MAX_AGE_MS = 5_000;

export async function POST(request: Request) {
  const limit = rateLimit(
    `checkout:${clientIp(request.headers)}`,
    CHECKOUT_LIMIT,
    CHECKOUT_WINDOW_MS,
  );
  if (!limit.ok) {
    return Response.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return Response.json(
      { error: "Checkout isn’t set up yet — please check back soon." },
      { status: 503 },
    );
  }

  let body: { quantity?: number; zone?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // We only ship within Greece. Anything else must go through Instagram DM.
  const zone = SHIPPING_ZONES.find((z) => z.id === body.zone);
  if (!zone) {
    return Response.json(
      { error: "Please choose a shipping destination within Greece." },
      { status: 400 },
    );
  }

  let quantity = Math.floor(Number(body.quantity ?? 1));
  if (!Number.isFinite(quantity) || quantity < 1) quantity = 1;
  if (quantity > MAX_PER_ORDER) quantity = MAX_PER_ORDER;

  // Authoritative stock check (Stripe is the source of truth).
  let sold: number;
  try {
    sold = await getSoldCountCached(stripe, PRODUCT.id, CHECKOUT_MAX_AGE_MS);
  } catch (err) {
    console.error("checkout: getSoldCount failed", err);
    return Response.json(
      { error: "Couldn’t verify availability. Please try again." },
      { status: 503 },
    );
  }

  const remaining = Math.max(0, TOTAL_STOCK - sold);
  if (remaining <= 0) {
    return Response.json({ error: "Sold out.", soldOut: true }, { status: 409 });
  }
  if (quantity > remaining) quantity = remaining;

  const imageUrl = `${SITE_URL}${PRODUCT.image}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity,
        price_data: {
          currency: PRODUCT.currency,
          unit_amount: PRODUCT.amount, // €60 + 24% VAT = €74.40
          product_data: {
            name: PRODUCT.name,
            // Stripe only renders images it can fetch over HTTPS, so a local
            // http:// dev origin simply omits it.
            ...(SITE_URL.startsWith("https://") ? { images: [imageUrl] } : {}),
          },
        },
      },
    ],
    shipping_address_collection: { allowed_countries: ["GR"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: zone.label,
          fixed_amount: { amount: zone.amount, currency: PRODUCT.currency },
          delivery_estimate: {
            minimum: { unit: "business_day", value: zone.estimate.min },
            maximum: { unit: "business_day", value: zone.estimate.max },
          },
        },
      },
    ],
    // Tagged so getSoldCount() can tally paid units.
    payment_intent_data: {
      metadata: { product: PRODUCT.id, qty: String(quantity), zone: zone.id },
    },
    metadata: { product: PRODUCT.id, qty: String(quantity), zone: zone.id },
    success_url: `${SITE_URL}/?checkout=success`,
    cancel_url: `${SITE_URL}/?checkout=cancel`,
  });

  return Response.json({ url: session.url });
}
