// Server-only Stripe helpers. The import below turns "someone imported this
// into a client component" from a silent secret leak into a build error.
import "server-only";
import Stripe from "stripe";
import type { ShippingZone } from "./shop";

let client: Stripe | null = null;

/** Returns a Stripe client, or null if the secret key isn't configured yet. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

/**
 * The Checkout shipping option for a zone. Shared by session creation and the
 * address update in /api/checkout/shipping so both charge exactly the same.
 */
export function shippingOptionFor(zone: ShippingZone) {
  return {
    shipping_rate_data: {
      type: "fixed_amount" as const,
      display_name: zone.label,
      fixed_amount: { amount: zone.amount, currency: "eur" },
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: zone.estimate.min },
        maximum: { unit: "business_day" as const, value: zone.estimate.max },
      },
    },
  };
}

/**
 * Units of `productId` paid for in a single PaymentIntent, grouped by size
 * (unsized products bucket under the empty string key).
 *
 * Orders created before the multi-product cart used flat `metadata.product` /
 * `metadata.qty` (one product per order). Orders since carry a JSON
 * `metadata.items` array so a single checkout can mix products. Both are read
 * here so old paid orders keep counting correctly against today's stock.
 */
function soldUnitsFor(pi: Stripe.PaymentIntent, productId: string): Record<string, number> {
  const md = pi.metadata ?? {};
  const bySize: Record<string, number> = {};
  const add = (size: string | undefined, qty: number) => {
    const key = size ?? "";
    bySize[key] = (bySize[key] ?? 0) + (Number.isFinite(qty) && qty > 0 ? qty : 1);
  };

  if (md.product === productId) {
    add(undefined, Number(md.qty ?? "1"));
    return bySize;
  }

  if (md.items) {
    try {
      const items = JSON.parse(md.items) as { id?: string; size?: string; qty?: number }[];
      for (const item of items) {
        if (item.id === productId) add(item.size, Number(item.qty));
      }
    } catch {
      // ignore
    }
  }

  return bySize;
}

/**
 * How many units of `productId` have been paid for so far, grouped by size
 * (unsized products bucket under the empty string key).
 *
 * Stripe is the source of truth: we tag each PaymentIntent's metadata with
 * what was bought, then sum succeeded ones. No separate database.
 *
 * Uses the List API (not Search): it's strongly consistent and available on
 * every account immediately, whereas the Search index is eventually-consistent
 * and isn't provisioned on brand-new accounts. Volume here is tiny, so listing
 * and filtering in code is cheap.
 */
export async function getSoldCountsBySize(
  stripe: Stripe,
  productId: string,
): Promise<Record<string, number>> {
  const bySize: Record<string, number> = {};
  let startingAfter: string | undefined = undefined;

  do {
    const res: Stripe.ApiList<Stripe.PaymentIntent> =
      await stripe.paymentIntents.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

    for (const pi of res.data) {
      if (pi.status !== "succeeded") continue;
      for (const [size, qty] of Object.entries(soldUnitsFor(pi, productId))) {
        bySize[size] = (bySize[size] ?? 0) + qty;
      }
    }

    startingAfter = res.has_more
      ? res.data[res.data.length - 1]?.id
      : undefined;
  } while (startingAfter);

  return bySize;
}

/** Total units of `productId` paid for so far, across all sizes. */
export async function getSoldCount(
  stripe: Stripe,
  productId: string,
): Promise<number> {
  const bySize = await getSoldCountsBySize(stripe, productId);
  return Object.values(bySize).reduce((sum, n) => sum + n, 0);
}

type CacheEntry = { value: Record<string, number>; at: number };

// Keyed by productId — two stock-limited products (backpiece print,
// oversized tee) now share this cache, so a single unkeyed entry would have
// one product reading the other's cached count.
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<Record<string, number>>>();

/**
 * Cached, request-collapsed wrapper around getSoldCountsBySize().
 *
 * getSoldCountsBySize() pages through the account's entire PaymentIntent
 * history, so calling it per request turned one inbound HTTP request into N
 * Stripe API calls. Both endpoints that use it are public and
 * unauthenticated, and the storefront calls /api/availability on every page
 * load — so a simple loop could exhaust Stripe's rate limit, at which point
 * getSoldCountsBySize() throws and checkout starts returning 503. The shop
 * would stop taking money for as long as the loop ran.
 *
 * Two mechanisms, and the second matters more than the first:
 *
 *   - `maxAgeMs` lets each caller pick its own freshness. The storefront badge
 *     tolerates a stale count; checkout asks for a near-live one.
 *   - Concurrent callers for the same product share a single in-flight
 *     request. A burst of any size collapses to one Stripe round trip,
 *     whatever maxAgeMs each one asked for (an in-flight fetch is by
 *     definition at least as fresh as "now").
 *
 * Cache lives in module scope, so it is per-instance and empty after a deploy.
 * That is fine: a cold miss is one extra call, and correctness never depends on
 * the cache — checkout re-checks stock before creating a session.
 */
export async function getSoldCountsBySizeCached(
  stripe: Stripe,
  productId: string,
  maxAgeMs: number,
): Promise<Record<string, number>> {
  const now = Date.now();
  // Strictly-less-than, so maxAgeMs of 0 always refetches rather than reusing
  // an entry written in the same millisecond.
  const entry = cache.get(productId);
  if (entry && now - entry.at < maxAgeMs) return entry.value;

  // A fetch for this product is already out — join it instead of starting a
  // second one.
  const pending = inFlight.get(productId);
  if (pending) return pending;

  const promise = getSoldCountsBySize(stripe, productId)
    .then((value) => {
      cache.set(productId, { value, at: Date.now() });
      return value;
    })
    .finally(() => {
      inFlight.delete(productId);
    });

  inFlight.set(productId, promise);
  return promise;
}

/** Cached total units of `productId` paid for so far, across all sizes. */
export async function getSoldCountCached(
  stripe: Stripe,
  productId: string,
  maxAgeMs: number,
): Promise<number> {
  const bySize = await getSoldCountsBySizeCached(stripe, productId, maxAgeMs);
  return Object.values(bySize).reduce((sum, n) => sum + n, 0);
}

export type Order = {
  id: string;
  created: number; // unix seconds
  email: string | null;
  name: string | null;
  phone: string | null;
  address: Stripe.Address | null;
  amountTotal: number | null; // cents, VAT + shipping included
  currency: string | null;
  zone: string | null;
  items: { id: string; size?: string; qty: number }[];
};

function parseItems(md: Stripe.Metadata | null): Order["items"] {
  if (!md?.items) return [];
  try {
    const parsed = JSON.parse(md.items) as { id?: string; size?: string; qty?: number }[];
    return parsed
      .filter((i): i is { id: string; size?: string; qty?: number } => typeof i.id === "string")
      .map((i) => ({ id: i.id, size: i.size, qty: Number(i.qty) > 0 ? Number(i.qty) : 1 }));
  } catch {
    return [];
  }
}

/**
 * Paid orders, most recent first. Stripe is the source of truth (no
 * database) — each Checkout Session already carries the buyer's shipping
 * details and the cart contents (tagged in `metadata.items` at checkout), so
 * a completed Session *is* the order record.
 *
 * Paginated with Checkout Sessions' native id-based cursor. `startingAfter`
 * is the last order id from the previous page.
 */
export async function listOrders(
  stripe: Stripe,
  { limit = 20, startingAfter }: { limit?: number; startingAfter?: string } = {},
): Promise<{ orders: Order[]; hasMore: boolean; nextCursor: string | null }> {
  const res = await stripe.checkout.sessions.list({
    limit: Math.min(Math.max(limit, 1), 100),
    ...(startingAfter ? { starting_after: startingAfter } : {}),
  });

  const orders = res.data
    .filter((s) => s.payment_status === "paid")
    .map((s) => {
      const shipping = s.collected_information?.shipping_details;
      return {
        id: s.id,
        created: s.created,
        email: s.customer_details?.email ?? null,
        name: shipping?.name ?? s.customer_details?.name ?? null,
        phone: s.customer_details?.phone ?? null,
        address: shipping?.address ?? s.customer_details?.address ?? null,
        amountTotal: s.amount_total,
        currency: s.currency,
        zone: s.metadata?.zone ?? null,
        items: parseItems(s.metadata),
      };
    });

  return {
    orders,
    // has_more reflects the raw page, not the paid-only filter above, so the
    // "next page" cursor always advances even when a page is all abandoned
    // (unpaid) checkouts.
    hasMore: res.has_more,
    nextCursor: res.data.length ? res.data[res.data.length - 1].id : null,
  };
}
