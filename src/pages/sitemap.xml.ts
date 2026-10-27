import { SITE_URL } from "@/lib/site";

const PAGES = [
  { url: SITE_URL, changefreq: "weekly", priority: 1 },
  { url: `${SITE_URL}/privacy`, changefreq: "yearly", priority: 0.3 },
  { url: `${SITE_URL}/terms`, changefreq: "yearly", priority: 0.3 },
];

export function GET() {
  const lastmod = new Date().toISOString();
  const urls = PAGES.map(
    (p) =>
      `<url>\n<loc>${p.url}</loc>\n<lastmod>${lastmod}</lastmod>\n<changefreq>${p.changefreq}</changefreq>\n<priority>${p.priority}</priority>\n</url>`,
  ).join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
