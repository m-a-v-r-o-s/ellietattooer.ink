import "server-only";

/**
 * Fixed-window, in-memory rate limiting.
 *
 * Deliberately process-local. The site runs as a single Railway service, so a
 * shared store (Redis) would buy cross-instance consistency we don't need at
 * the cost of a dependency and a network hop on every request. If this ever
 * runs on multiple instances the limits become per-instance — a looser ceiling,
 * but still a ceiling.
 *
 * This is defence in depth, not the main protection: request collapsing in
 * getSoldCountCached() is what actually keeps a flood off the Stripe API.
 */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

// Expired entries are swept on a later request rather than on a timer, so an
// idle process isn't kept awake and the map can't grow unbounded from one-off
// IPs. At most one sweep per interval.
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the current window resets. Zero when `ok`. */
  retryAfter: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const window = buckets.get(key);
  if (!window || window.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  window.count += 1;
  if (window.count > limit) {
    return { ok: false, retryAfter: Math.ceil((window.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Best-effort client IP.
 *
 * Railway terminates TLS at a proxy, so the socket address is the proxy's and
 * the real client is the left-most `x-forwarded-for` entry. That header is
 * spoofable by anyone talking to us directly, which is why it only gates the
 * rate limiter and nothing that matters for correctness.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
