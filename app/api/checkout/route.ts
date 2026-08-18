import { getStripe, getSoldCountCached } from "@/lib/stripe";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  PRODUCTS,
  SCARCE_PRODUCT_ID,
  SHIPPING_ZONES,
  getProduct,
} from "@/lib/shop";
import type Stripe from "stripe";

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

type CartLine = { id?: string; size?: string; qty?: number };

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

  let body: { items?: CartLine[]; zone?: string };
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

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Resolve and price every line server-side. Never trust a client-sent
  // price or product name — only the id, size and quantity are read from the
  // request, everything else comes from the PRODUCTS registry.
  //
  // Cart lines are aggregated by product+size before any cap is applied. A
  // client could otherwise split one item across several JSON lines (each
  // individually under maxPerOrder, or under the scarce product's remaining
  // stock) and have every line clamped independently — capping 1+1+1 to
  // 1-each still lets 3 through against a 1-per-order limit.
  type ResolvedLine = { product: (typeof PRODUCTS)[number]; size?: string; qty: number };
  const byKey = new Map<string, ResolvedLine>();

  for (const raw of body.items) {
    const product = typeof raw.id === "string" ? getProduct(raw.id) : undefined;
    if (!product) {
      return Response.json({ error: "One of the items in your cart is no longer available." }, { status: 400 });
    }

    // Only a product with a real size list has a size worth keying on —
    // anything else collapses to one key regardless of what's sent, so an
    // arbitrary/varying `size` value can't be used to dodge aggregation.
    let size: string | undefined;
    if (product.sizes) {
      if (typeof raw.size !== "string" || !product.sizes.includes(raw.size)) {
        return Response.json({ error: `Please choose a size for ${product.name}.` }, { status: 400 });
      }
      size = raw.size;
    }

    let qty = Math.floor(Number(raw.qty ?? 1));
    if (!Number.isFinite(qty) || qty < 1) qty = 1;

    const key = `${product.id}::${size ?? ""}`;
    const existing = byKey.get(key);
    byKey.set(key, { product, size, qty: (existing?.qty ?? 0) + qty });
  }

  const lines = [...byKey.values()];
  for (const line of lines) {
    if (line.qty > line.product.maxPerOrder) line.qty = line.product.maxPerOrder;
  }

  // Authoritative stock check for the one stock-limited product (Stripe is
  // the source of truth for units already sold).
  const scarceLine = lines.find((l) => l.product.id === SCARCE_PRODUCT_ID);
  if (scarceLine) {
    let sold: number;
    try {
      sold = await getSoldCountCached(stripe, SCARCE_PRODUCT_ID, CHECKOUT_MAX_AGE_MS);
    } catch (err) {
      console.error("checkout: getSoldCount failed", err);
      return Response.json(
        { error: "Couldn’t verify availability. Please try again." },
        { status: 503 },
      );
    }

    const remaining = Math.max(0, (scarceLine.product.totalStock ?? 0) - sold);
    if (remaining <= 0) {
      return Response.json({ error: "Sold out.", soldOut: true }, { status: 409 });
    }
    if (scarceLine.qty > remaining) scarceLine.qty = remaining;
  }

  const currency = "eur";
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((line) => {
    const imageUrl = `${SITE_URL}${line.product.image}`;
    const name = line.size ? `${line.product.name} — ${line.size}` : line.product.name;
    return {
      quantity: line.qty,
      price_data: {
        currency,
        unit_amount: line.product.amount,
        product_data: {
          name,
          // Stripe only renders images it can fetch over HTTPS, so a local
          // http:// dev origin simply omits it.
          ...(SITE_URL.startsWith("https://") ? { images: [imageUrl] } : {}),
        },
      },
    };
  });

  // Tagged so getSoldCount() can tally paid units per product.
  const itemsMetadata = JSON.stringify(
    lines.map((l) => ({ id: l.product.id, size: l.size, qty: l.qty })),
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    phone_number_collection: { enabled: true },
    shipping_address_collection: { allowed_countries: ["GR"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: zone.label,
          fixed_amount: { amount: zone.amount, currency },
          delivery_estimate: {
            minimum: { unit: "business_day", value: zone.estimate.min },
            maximum: { unit: "business_day", value: zone.estimate.max },
          },
        },
      },
    ],
    payment_intent_data: {
      metadata: { items: itemsMetadata, zone: zone.id },
    },
    metadata: { items: itemsMetadata, zone: zone.id },
    success_url: `${SITE_URL}/?checkout=success`,
    cancel_url: `${SITE_URL}/?checkout=cancel`,
  });

  return Response.json({ url: session.url });
}
