# Ellie Tattooer

ellietattooer.com: Astro site with React islands, served by the Astro Node
adapter on Railway. Shop and checkout details live in `SHOP_SETUP.md`.

```bash
npm install
npm run dev      # http://localhost:3005, reads .env.local (see .env.example)
npm run build    # prerenders pages into dist/, builds the API and /admin server
npm run start    # node server.mjs: the production server
npm run check    # astro check (types)
npm run lint
```

`server.mjs` is the production entry: it adds the security headers and the
apex/section redirects to every response, prerendered pages included.
