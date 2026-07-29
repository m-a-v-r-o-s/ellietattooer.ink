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
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://ritualtattoo.gr",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
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
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Two years, subdomains included. No `preload` — that ships the
          // domain to a browser-baked list that is slow and painful to undo.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
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
