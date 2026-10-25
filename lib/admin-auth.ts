import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { clientIp } from "@/lib/rate-limit";

// The one Basic Auth check for /admin. Called by proxy.ts (first gate) and by
// the admin page itself, because a proxy must never be the only check
// (matcher gaps, CVE-2025-29927).

export type AdminAuth =
  | { ok: true }
  | { ok: false; status: 401 | 503 }
  | { ok: false; status: 429; retryAfter: number };

const digest = (s: string) => createHash("sha256").update(s).digest();

// Failed attempts per client IP; the lockout grows 30s, 60s, 120s... up to 15
// min once MAX_FREE failures are used. A correct login clears it.
// ponytail: in-memory, single instance, resets on restart. Move to a shared
// store if the service ever runs on more than one instance.
const MAX_FREE = 5;
const fails = new Map<string, { count: number; lockedUntil: number }>();

export function checkAdminAuth(headers: Headers): AdminAuth {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (!user || !password) return { ok: false, status: 503 }; // fail closed

  const ip = clientIp(headers);
  const now = Date.now();
  const entry = fails.get(ip);
  if (entry && entry.lockedUntil > now) {
    return { ok: false, status: 429, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
  }

  const auth = headers.get("authorization");
  // No credentials yet is the browser's first visit, not a failed guess.
  if (!auth?.startsWith("Basic ")) return { ok: false, status: 401 };

  const given = Buffer.from(auth.slice(6), "base64").toString();
  // Equal-length digests keep timingSafeEqual happy and hide length.
  if (timingSafeEqual(digest(given), digest(`${user}:${password}`))) {
    fails.delete(ip);
    return { ok: true };
  }

  if (fails.size > 10_000) {
    for (const [k, v] of fails) if (v.lockedUntil <= now) fails.delete(k);
  }
  const count = (entry?.count ?? 0) + 1;
  const lock = count > MAX_FREE ? Math.min(30_000 * 2 ** (count - MAX_FREE - 1), 900_000) : 0;
  fails.set(ip, { count, lockedUntil: now + lock });
  return { ok: false, status: 401 };
}
