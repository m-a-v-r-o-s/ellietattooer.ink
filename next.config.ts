import type { NextConfig } from "next";

// Content-Security-Policy.
//
// 'unsafe-inline' in script-src is required: Next injects inline bootstrap and
// RSC-payload scripts, and nonce-ing them needs middleware on every request.
// That trade is acceptable here because the site renders no user-supplied
// content anywhere — there is no injection point for the stricter policy to
// defend. The clauses earning their keep are frame-ancestors (clickjacking, and
// this page has a buy button) and form-action/base-uri.
//
// img-src carries the studio logo host, which is hotlinked from the header and
// footer via a plain <img>. data: covers next/image blur placeholders.
//
// The googletagmanager.com / google-analytics.com entries are for the GA4
// scaffold in app/layout.tsx, which only ever loads a script tag when
// NEXT_PUBLIC_GA_MEASUREMENT_ID is set — harmless allow-list entries until
// then, and one less thing to remember to change alongside that env var.
//
// frame-src allows the studio-info Google Maps embed; without it default-src
// 'self' blocks the iframe outright and it silently renders blank.
//
// The js.stripe.com / api.stripe.com / hooks.stripe.com / *.stripe.com
// entries are for Stripe's Elements-based checkout (app/CheckoutPanel.tsx):
// Stripe.js itself, the Address/Payment Elements' XHR calls, the iframes
// card fields and 3D Secure challenges render in, and the card-network/wallet
// icons the Payment Element loads from Stripe's CDN.
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

const nextConfig: NextConfig = {
  // Railway holds the publishable key as STRIPE_PUBLISHABLE_KEY, but the
  // browser only sees NEXT_PUBLIC_* values, inlined at build time.
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY ?? "",
  },
  async redirects() {
    return [
      // Apex and www both resolve to this app. Without a redirect Google
      // treats them as two competing sites for every page. www is canonical,
      // matching the other sites and the sitemap already registered in
      // Search Console.
      {
        source: "/:path*",
        has: [{ type: "host", value: "ellietattooer.com" }],
        destination: "https://www.ellietattooer.com/:path*",
        permanent: true,
      },
      // Shareable direct links to each homepage section.
      { source: "/shop", destination: "/#shop", permanent: false },
      { source: "/gallery", destination: "/#portfolio", permanent: false },
      { source: "/contact", destination: "/#about", permanent: false },
      { source: "/studio", destination: "/#findme", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          // Belt-and-braces alongside frame-ancestors, for older browsers.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // payment=() would block the Payment Request API entirely, which
            // hides Apple Pay / Google Pay inside Stripe's Payment Element.
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
          },
          // Two years, subdomains included. No `preload` — that ships the
          // domain to a browser-baked list that is slow and painful to undo.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
      {
        // Belt-and-braces alongside metadata.robots and robots.ts on the
        // page itself — a crawler that ignores both still gets this.
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  images: {
    // WebP only. Sources are already WebP, so AVIF buys ~1KB per thumbnail
    // while costing ~4.7x the encode time and ~400MB of resident memory that
    // libvips never returns to the OS — the bulk of our hosting bill.
    formats: ["image/webp"],
    // Nothing we ship is wider than 1800px (elliebanner.webp), so the 2048 and
    // 3840 breakpoints only ever produce source-capped duplicates.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Portfolio assets are content-stable (date-stamped filenames), so
    // cache optimized variants aggressively to avoid re-optimization.
    minimumCacheTTL: 2678400, // 31 days
  },
};

export default nextConfig;
