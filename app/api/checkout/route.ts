import { getStripe, getSoldCount } from "@/lib/stripe";
import {
  PRODUCT,
  TOTAL_STOCK,
  MAX_PER_ORDER,
  SHIPPING_ZONES,
} from "@/lib/shop";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
    sold = await getSoldCount(stripe, PRODUCT.id);
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

  const h = request.headers;
  const host = h.get("host");
  const origin =
    h.get("origin") ||
    (host ? `${h.get("x-forwarded-proto") || "https"}://${host}` : "") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://ellietattooer.com";
  const imageUrl = `${origin}${PRODUCT.image}`;

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
            // Stripe only renders images it can fetch over HTTPS.
            ...(origin.startsWith("https") ? { images: [imageUrl] } : {}),
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
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancel`,
  });

  return Response.json({ url: session.url });
}
