// Server-only Stripe helpers. Do NOT import this into client components.
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
