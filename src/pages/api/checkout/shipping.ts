import type { APIContext } from "astro";
import { getStripe, shippingOptionFor } from "@/lib/stripe";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { zoneFromPostalCode } from "@/lib/postal-zones";

// On-demand: these read Stripe and the request on every call.
export const prerender = false;

// Fires once per completed address edit, so a real buyer sends a handful.
const SHIPPING_LIMIT = 30;
const SHIPPING_WINDOW_MS = 5 * 60_000;

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s && s.length <= max ? s : null;
}

function fail(error: string, status = 400) {
  return Response.json({ error }, { status });
}

/**
 * Puts the buyer's shipping address on their Checkout Session and prices
 * shipping from that address, in one server-side update.
 *
 * Sessions are created with permissions.update_shipping_details =
 * "server_only", so this route is the only way an address reaches a session
 * and Stripe won't confirm without one. The fee therefore always matches the
 * postal code it ships to, whatever was typed on the site beforehand.
 */
export async function POST({ request }: APIContext) {
  const limit = rateLimit(
    `checkout-shipping:${clientIp(request.headers)}`,
    SHIPPING_LIMIT,
    SHIPPING_WINDOW_MS,
  );
  if (!limit.ok) {
    return Response.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const stripe = getStripe();
  if (!stripe) return fail("Checkout isn’t set up yet. Please check back soon.", 503);

  let body: { sessionId?: unknown; name?: unknown; address?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.");
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{1,200}$/.test(sessionId)) return fail("Invalid request.");

  const a = body.address ?? {};
  const name = text(body.name, 200);
  const line1 = text(a.line1, 200);
  const city = text(a.city, 100);
  const postalCode = text(a.postal_code, 10);
  if (!name || !line1 || !city || !postalCode) return fail("Please complete your shipping address.");
  if (a.country !== "GR") return fail("We only ship within Greece.");

  const zone = zoneFromPostalCode(postalCode);
  if (!zone || zone === "international") {
    return fail("We couldn’t verify this postal code. Please check it and try again.");
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.status !== "open" || !session.metadata?.items) {
      return fail("This checkout has expired. Please start again.", 409);
    }

    const line2 = text(a.line2, 200);
    const state = text(a.state, 100);
    await stripe.checkout.sessions.update(sessionId, {
      collected_information: {
        shipping_details: {
          name,
          address: {
            country: "GR",
            line1,
            city,
            postal_code: postalCode,
            ...(line2 ? { line2 } : {}),
            ...(state ? { state } : {}),
          },
        },
      },
      shipping_options: [shippingOptionFor(zone)],
      // The orders page reads the charged zone from here.
      metadata: { ...session.metadata, zone: zone.id },
    });
  } catch (err) {
    console.error("checkout/shipping: update failed", err);
    return fail("Couldn’t update shipping. Please try again.", 502);
  }

  return Response.json({ zone: zone.id });
}
