import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
