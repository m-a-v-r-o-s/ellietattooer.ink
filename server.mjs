// Production entry point: `node server.mjs` (after `astro build`).
//
// Wraps Astro's standalone Node handler so that every response, prerendered
// pages and static files included, gets the security headers and redirects
// below. Astro middleware (src/middleware.ts) only runs for on-demand routes,
// so it can't cover the prerendered ones.
import http from "node:http";

process.env.ASTRO_NODE_AUTOSTART = "disabled";
const { handler } = await import("./dist/server/entry.mjs");

// Content-Security-Policy.
//
// 'unsafe-inline' in script-src is required: Astro inlines its island loader
// and hydration scripts, and nonce-ing them needs per-request rendering of
// pages that are otherwise prerendered. That trade is acceptable here because
// the site renders no user-supplied content anywhere — there is no injection
// point for the stricter policy to defend. The clauses earning their keep are
// frame-ancestors (clickjacking, and this page has a buy button) and
// form-action/base-uri.
//
// img-src carries the studio logo host, which is hotlinked from the Find the
// studio section via a plain <img>. data: is kept from the Next build.
//
// The googletagmanager.com / google-analytics.com entries are for the GA4
// scaffold in src/layouts/Base.astro, which only ever loads a script tag when
// PUBLIC_GA_MEASUREMENT_ID is set — harmless allow-list entries until then,
// and one less thing to remember to change alongside that env var.
//
// frame-src allows the studio-info Google Maps embed; without it default-src
// 'self' blocks the iframe outright and it silently renders blank.
//
// The js.stripe.com / api.stripe.com / hooks.stripe.com / *.stripe.com
// entries are for Stripe's Elements-based checkout
// (src/components/CheckoutPanel.tsx): Stripe.js itself, the Address/Payment
// Elements' XHR calls, the iframes card fields and 3D Secure challenges render
// in, and the card-network/wallet icons the Payment Element loads from
// Stripe's CDN.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://ritualtattoo.gr https://*.stripe.com",
  "font-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://api.stripe.com",
  "frame-src https://www.google.com https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const HEADERS = {
  "Content-Security-Policy": CSP,
  // Belt-and-braces alongside frame-ancestors, for older browsers.
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // payment=() would block the Payment Request API entirely, which hides
  // Apple Pay / Google Pay inside Stripe's Payment Element.
  "Permissions-Policy": 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
  // Two years, subdomains included. No `preload` — that ships the domain to a
  // browser-baked list that is slow and painful to undo.
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
};

// Shareable direct links to each homepage section.
const SECTIONS = {
  "/shop": "/#shop",
  "/gallery": "/#portfolio",
  "/contact": "/#about",
  "/studio": "/#findme",
};

function redirect(res, status, location) {
  res.writeHead(status, { Location: location }).end();
}

const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || "0.0.0.0";

http
  .createServer((req, res) => {
    const url = req.url ?? "/";
    const q = url.indexOf("?");
    const path = q === -1 ? url : url.slice(0, q);
    const query = q === -1 ? "" : url.slice(q);

    for (const [k, v] of Object.entries(HEADERS)) res.setHeader(k, v);
    // Belt-and-braces alongside the page's own robots meta and robots.txt —
    // a crawler that ignores both still gets this.
    if (path === "/admin" || path.startsWith("/admin/")) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }

    // Apex and www both resolve to this app. Without a redirect Google treats
    // them as two competing sites for every page. www is canonical, matching
    // the other sites and the sitemap already registered in Search Console.
    if ((req.headers.host ?? "").replace(/:\d+$/, "") === "ellietattooer.com") {
      return redirect(res, 308, `https://www.ellietattooer.com${url}`);
    }
    if (path.length > 1 && path.endsWith("/")) {
      // Leading slashes collapse too, so "//evil.com/" can't become a
      // protocol-relative redirect off-site.
      return redirect(res, 308, "/" + path.replace(/^\/+|\/+$/g, "") + query);
    }
    if (SECTIONS[path]) return redirect(res, 307, SECTIONS[path]);

    handler(req, res);
  })
  .listen(port, host, () => console.log(`Listening on http://${host}:${port}`));
