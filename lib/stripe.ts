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
 */
export async function getSoldCount(
  stripe: Stripe,
  productId: string,
): Promise<number> {
  let sold = 0;
  let page: string | undefined = undefined;

  do {
    const res: Stripe.ApiSearchResult<Stripe.PaymentIntent> =
      await stripe.paymentIntents.search({
        query: `status:'succeeded' AND metadata['product']:'${productId}'`,
        limit: 100,
        ...(page ? { page } : {}),
      });

    for (const pi of res.data) {
      const qty = Number(pi.metadata?.qty ?? "1");
      sold += Number.isFinite(qty) && qty > 0 ? qty : 1;
    }

    page = res.has_more ? (res.next_page ?? undefined) : undefined;
  } while (page);

  return sold;
}
