import { getStripe, getSoldCount } from "@/lib/stripe";
import { PRODUCT, TOTAL_STOCK, MAX_PER_ORDER } from "@/lib/shop";

export const runtime = "nodejs";

// Tells the storefront whether the print can still be bought, and the most a
// single order may contain — without ever revealing the actual stock numbers.
export async function GET() {
  const stripe = getStripe();

  // Not wired to Stripe yet (no key): let the page render normally pre-launch.
  if (!stripe) {
    return Response.json({
      available: true,
      remaining: TOTAL_STOCK,
      maxPerOrder: MAX_PER_ORDER,
      configured: false,
    });
  }

  try {
    const sold = await getSoldCount(stripe, PRODUCT.id);
    const remaining = Math.max(0, TOTAL_STOCK - sold);
    return Response.json({
      available: remaining > 0,
      remaining,
      maxPerOrder: Math.min(MAX_PER_ORDER, remaining),
      configured: true,
    });
  } catch {
    // Transient Stripe error: fail open for display only — checkout still
    // re-verifies stock authoritatively before taking any money.
    return Response.json({
      available: true,
      remaining: TOTAL_STOCK,
      maxPerOrder: MAX_PER_ORDER,
      configured: true,
    });
  }
}
