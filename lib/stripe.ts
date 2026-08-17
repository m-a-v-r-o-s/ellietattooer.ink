// Server-only Stripe helpers. The import below turns "someone imported this
// into a client component" from a silent secret leak into a build error.
import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Returns a Stripe client, or null if the secret key isn't configured yet. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

/**
 * Units of `productId` paid for in a single PaymentIntent.
 *
 * Orders created before the multi-product cart used flat `metadata.product` /
 * `metadata.qty` (one product per order). Orders since carry a JSON
 * `metadata.items` array so a single checkout can mix products. Both are read
 * here so old paid orders keep counting correctly against today's stock.
 */
function soldUnitsFor(pi: Stripe.PaymentIntent, productId: string): number {
  const md = pi.metadata ?? {};

  if (md.product === productId) {
    const qty = Number(md.qty ?? "1");
    return Number.isFinite(qty) && qty > 0 ? qty : 1;
  }

  if (md.items) {
    try {
      const items = JSON.parse(md.items) as { id?: string; qty?: number }[];
      return items
        .filter((item) => item.id === productId)
        .reduce((sum, item) => {
          const qty = Number(item.qty);
          return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
        }, 0);
    } catch {
      return 0;
    }
  }

  return 0;
}

/**
 * How many units of `productId` have been paid for so far.
 *
 * Stripe is the source of truth: we tag each PaymentIntent's metadata with
 * what was bought, then sum succeeded ones. No separate database.
 *
 * Uses the List API (not Search): it's strongly consistent and available on
 * every account immediately, whereas the Search index is eventually-consistent
 * and isn't provisioned on brand-new accounts. Volume here is tiny, so listing
 * and filtering in code is cheap.
 */
export async function getSoldCount(
  stripe: Stripe,
  productId: string,
): Promise<number> {
  let sold = 0;
  let startingAfter: string | undefined = undefined;

  do {
    const res: Stripe.ApiList<Stripe.PaymentIntent> =
      await stripe.paymentIntents.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

    for (const pi of res.data) {
      if (pi.status !== "succeeded") continue;
      sold += soldUnitsFor(pi, productId);
    }

    startingAfter = res.has_more
      ? res.data[res.data.length - 1]?.id
      : undefined;
  } while (startingAfter);

  return sold;
}

type CacheEntry = { value: number; at: number };

let cached: CacheEntry | null = null;
let inFlight: Promise<number> | null = null;

/**
 * Cached, request-collapsed wrapper around getSoldCount().
 *
 * getSoldCount() pages through the account's entire PaymentIntent history, so
 * calling it per request turned one inbound HTTP request into N Stripe API
 * calls. Both endpoints that use it are public and unauthenticated, and the
 * storefront calls /api/availability on every page load — so a simple loop
 * could exhaust Stripe's rate limit, at which point getSoldCount() throws and
 * checkout starts returning 503. The shop would stop taking money for as long
 * as the loop ran.
 *
 * Two mechanisms, and the second matters more than the first:
 *
 *   - `maxAgeMs` lets each caller pick its own freshness. The storefront badge
 *     tolerates a stale count; checkout asks for a near-live one.
 *   - Concurrent callers share a single in-flight request. A burst of any size
 *     collapses to one Stripe round trip, whatever maxAgeMs each one asked for
 *     (an in-flight fetch is by definition at least as fresh as "now").
 *
 * Cache lives in module scope, so it is per-instance and empty after a deploy.
 * That is fine: a cold miss is one extra call, and correctness never depends on
 * the cache — checkout re-checks stock before creating a session.
 */
export async function getSoldCountCached(
  stripe: Stripe,
  productId: string,
  maxAgeMs: number,
): Promise<number> {
  const now = Date.now();
  // Strictly-less-than, so maxAgeMs of 0 always refetches rather than reusing
  // an entry written in the same millisecond.
  if (cached && now - cached.at < maxAgeMs) return cached.value;

  // A fetch is already out — join it instead of starting a second one.
  if (inFlight) return inFlight;

  inFlight = getSoldCount(stripe, productId)
    .then((value) => {
      cached = { value, at: Date.now() };
      return value;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
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
