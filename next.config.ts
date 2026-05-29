import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve AVIF when supported (smaller), fall back to WebP.
    formats: ["image/avif", "image/webp"],
    // Portfolio assets are content-stable (date-stamped filenames), so
    // cache optimized variants aggressively to avoid re-optimization.
    minimumCacheTTL: 2678400, // 31 days
  },
};

export default nextConfig;
