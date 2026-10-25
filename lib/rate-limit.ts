import "server-only";
import { BlockList, isIP } from "node:net";

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

// Cloudflare's published edge ranges, https://www.cloudflare.com/ips-v4 and
// /ips-v6, fetched 2026-10-25. Re-check occasionally; they change rarely.
const cloudflare = new BlockList();
for (const c of `173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22
141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 188.114.96.0/20
197.234.240.0/22 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13 104.24.0.0/14
172.64.0.0/13 131.0.72.0/22`.split(/\s+/)) {
  const [net, bits] = c.split("/");
  cloudflare.addSubnet(net, Number(bits), "ipv4");
}
for (const c of `2400:cb00::/32 2606:4700::/32 2803:f800::/32 2405:b500::/32
2405:8100::/32 2a06:98c0::/29 2c0f:f248::/32`.split(/\s+/)) {
  const [net, bits] = c.split("/");
  cloudflare.addSubnet(net, Number(bits), "ipv6");
}

/**
 * Client IP, from headers a client cannot forge.
 *
 * Railway's edge sets `x-real-ip` to the address that actually connected, so a
 * client cannot choose it. Behind Cloudflare that address is a Cloudflare node
 * and the visitor is in `cf-connecting-ip`, trusted only when the connecting
 * address really is inside Cloudflare's ranges. `x-forwarded-for` is never
 * read: its first entry is whatever the client sent.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim() ?? "";
  const family = isIP(real);
  if (!family) return "unknown";
  if (cloudflare.check(real, family === 4 ? "ipv4" : "ipv6")) {
    const cf = headers.get("cf-connecting-ip")?.trim() ?? "";
    if (isIP(cf)) return cf;
  }
  return real;
}
