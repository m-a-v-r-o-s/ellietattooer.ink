## Stack

Astro 7 with React islands, served by `@astrojs/node` (standalone) on Railway.
Pages are prerendered; `src/pages/api/*` and `/admin` are on-demand
(`prerender = false`). `server.mjs` is the production entry: it wraps Astro's
handler to add the security headers and redirects to every response, since
Astro middleware doesn't run for prerendered pages.

Astro 7 is newer than most training data. Check the types in
`node_modules/astro/dist/types/public/` (and the adapter in
`node_modules/@astrojs/node/dist/`) before relying on an API.

Shop rules and Railway notes: `SHOP_SETUP.md`.
