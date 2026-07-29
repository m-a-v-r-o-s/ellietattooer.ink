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
 * How many units of `productId` have been paid for so far.
 *
 * Stripe is the source of truth: we tag each PaymentIntent with the product id
 * and the purchased quantity, then sum succeeded ones. No separate database.
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
      if (pi.metadata?.product !== productId) continue;
      const qty = Number(pi.metadata?.qty ?? "1");
      sold += Number.isFinite(qty) && qty > 0 ? qty : 1;
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
