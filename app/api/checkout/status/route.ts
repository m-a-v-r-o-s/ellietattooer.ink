import { getStripe } from "@/lib/stripe";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Same shape of concern as the other checkout endpoints: public,
// unauthenticated, called right after the buyer lands back on the site.
const STATUS_LIMIT = 30;
const STATUS_WINDOW_MS = 60_000;

// Called once the buyer returns from the in-page Elements checkout
// (return_url carries ?session_id=...) to find out whether payment actually
// went through, so the site can show the right banner and clear the cart.
export async function GET(request: Request) {
  const limit = rateLimit(
    `checkout-status:${clientIp(request.headers)}`,
    STATUS_LIMIT,
    STATUS_WINDOW_MS,
  );
  if (!limit.ok) {
    return Response.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]{1,200}$/.test(sessionId)) {
    return Response.json({ error: "Missing or invalid session_id." }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: "Checkout isn’t set up." }, { status: 503 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return Response.json({
      status: session.status,
      paymentStatus: session.payment_status,
    });
  } catch (err) {
    console.error("checkout/status: retrieve failed", err);
    return Response.json({ error: "Couldn’t look up that session." }, { status: 404 });
  }
}
