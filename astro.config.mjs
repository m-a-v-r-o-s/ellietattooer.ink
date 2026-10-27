import { defineConfig, fontProviders } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";

// Next loaded .env.local into process.env, which lib/stripe.ts and the admin
// gate read at runtime; Vite only exposes .env files on import.meta.env. Real
// environment variables (Railway) still win, and the file is gitignored.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: fine, e.g. on Railway
}

// lib/stripe.ts, lib/rate-limit.ts and lib/admin-auth.ts import "server-only"
// so a secret-bearing module can never end up in a browser bundle. Next
// resolved it to an empty module on the server through the react-server
// export condition; Vite has no such condition, so do the same here: empty on
// the server, a build error anywhere else.
const serverOnly = {
  name: "server-only",
  enforce: "pre",
  resolveId(id, importer) {
    if (id !== "server-only") return;
    if (this.environment.config.consumer === "client") {
      this.error(`"server-only" module imported into client code from ${importer}`);
    }
    return "\0server-only";
  },
  load(id) {
    if (id === "\0server-only") return "export {}";
  },
};

// Railway holds the publishable key as STRIPE_PUBLISHABLE_KEY, but the
// browser only sees PUBLIC_* values, inlined at build time.
const stripePublishableKey =
  process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY;

const google = fontProviders.google();

export default defineConfig({
  // Home, privacy, terms, 404, robots and sitemap are prerendered at build;
  // the API routes and /admin opt out with `prerender = false`.
  output: "static",
  adapter: node({
    // Started through server.mjs, which adds the site-wide headers and
    // redirects around the standalone handler.
    mode: "standalone",
    // The only request bodies are small JSON carts and addresses.
    bodySizeLimit: 1024 * 1024,
  }),
  integrations: [react()],
  // Nothing uses sessions; skip the adapter's filesystem session store.
  session: false,
  // Matches Next: /privacy, never /privacy/ (server.mjs redirects the slash).
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "always" },
  server: { port: 3005, host: true },
  fonts: [
    {
      provider: google,
      name: "Oswald",
      cssVariable: "--font-oswald",
      weights: [300, 400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
    // Home page display face (matches the bubble wordmark) and its label/body face.
    {
      provider: google,
      name: "Shrikhand",
      cssVariable: "--font-shrikhand",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: google,
      name: "DM Mono",
      cssVariable: "--font-dm-mono",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["monospace"],
    },
  ],
  vite: {
    plugins: [serverOnly],
    // Dev otherwise hands "server-only" straight to Node, skipping the plugin.
    ssr: { noExternal: ["server-only"] },
    define: stripePublishableKey
      ? { "import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY": JSON.stringify(stripePublishableKey) }
      : {},
  },
});
