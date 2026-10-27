// Run: node --conditions=react-server scripts/check-client-ip.ts
import assert from "node:assert/strict";
import { clientIp } from "../lib/rate-limit.ts";

const h = (o: Record<string, string>) => new Headers(o);
// Direct hit: forged XFF and CF header are ignored.
assert.equal(clientIp(h({ "x-real-ip": "203.0.113.9", "x-forwarded-for": "1.1.1.1", "cf-connecting-ip": "2.2.2.2" })), "203.0.113.9");
// Via Cloudflare (v4 and v6 edge): CF-Connecting-IP is trusted.
assert.equal(clientIp(h({ "x-real-ip": "172.70.1.2", "cf-connecting-ip": "198.51.100.7", "x-forwarded-for": "1.1.1.1" })), "198.51.100.7");
assert.equal(clientIp(h({ "x-real-ip": "2606:4700::1", "cf-connecting-ip": "198.51.100.7" })), "198.51.100.7");
// Cloudflare edge but junk CF header: fall back to the edge address.
assert.equal(clientIp(h({ "x-real-ip": "172.70.1.2", "cf-connecting-ip": "nope" })), "172.70.1.2");
// No x-real-ip: never fall back to XFF.
assert.equal(clientIp(h({ "x-forwarded-for": "1.1.1.1" })), "unknown");
console.log("clientIp ok");
