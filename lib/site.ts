// Public site identity shared by metadata (layout, robots, sitemap). Safe to
// import into client components — no secrets.
//
// app/api/checkout/route.ts keeps its own copy of this same fallback rather
// than importing it: that file's comment explains why the value must never
// be derived from the request, and duplicating one string is cheaper than a
// shared import creating a false impression the two call sites must change
// together.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ellietattooer.com"
).replace(/\/+$/, "");

export const SITE_NAME = "Ellie Tattooer";
