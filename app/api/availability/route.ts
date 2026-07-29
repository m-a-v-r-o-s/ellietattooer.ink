import { getStripe, getSoldCountCached } from "@/lib/stripe";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { PRODUCT, TOTAL_STOCK, MAX_PER_ORDER } from "@/lib/shop";

export const runtime = "nodejs";

// Called on every page load, so the ceiling is generous — it exists to stop a
// flood, not to inconvenience someone refreshing the page.
const AVAILABILITY_LIMIT = 120;
const AVAILABILITY_WINDOW_MS = 60_000;

// Display only. A minute-stale count is fine here; checkout re-checks with a
// much tighter freshness before it takes any money.
const AVAILABILITY_MAX_AGE_MS = 60_000;

// Tells the storefront whether the print can still be bought, how many are
// left (the page shows an "N LEFT" badge) and the most a single order may
// contain.
export async function GET(request: Request) {
  const limit = rateLimit(
    `availability:${clientIp(request.headers)}`,
    AVAILABILITY_LIMIT,
    AVAILABILITY_WINDOW_MS,
  );
  if (!limit.ok) {
    return Response.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

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
    const sold = await getSoldCountCached(
      stripe,
      PRODUCT.id,
      AVAILABILITY_MAX_AGE_MS,
    );
    const remaining = Math.max(0, TOTAL_STOCK - sold);
    return Response.json({
      available: remaining > 0,
      remaining,
      maxPerOrder: Math.min(MAX_PER_ORDER, remaining),
      configured: true,
    });
  } catch (err) {
    console.error("availability: getSoldCount failed", err);
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
