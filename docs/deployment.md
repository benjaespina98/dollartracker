# Deployment

The app deploys on [Vercel](https://vercel.com) from the `main` branch:
<https://dollartracker.vercel.app>. `npm run build` outputs a static site
(`dist/`) plus two Edge Functions (`api/market`, `api/history`); no server
process to manage.

## Environment variables

Set in the Vercel project settings (Project -> Settings -> Environment
Variables). See `.env.example` for a local template.

| Variable | Required | Purpose |
| --- | --- | --- |
| `TWELVE_DATA_API_KEY` | Yes, for the Markets cards (oil, indices, Ibovespa, Merval, grains) | Used server-side only, inside `api/market.ts` and `api/history.ts`. The rest of the app (dollar, euro, real, country risk, gold, crypto) works without it. |
| `VITE_DISABLE_ANALYTICS` | No | Set to `true` to disable Vercel Web Analytics in the build. Also needs to be turned off in Project -> Analytics for it to fully stop. |

## Security headers and CSP

`vercel.json` sets the Content-Security-Policy and other security headers for
every route:

- `script-src` allows `'self'` plus a `sha256-...` hash for the inline theme
  script in `index.html`. If that inline script changes, its hash has to be
  recalculated and updated here, or the browser will block it.
- `connect-src` lists every third-party host the client calls directly
  (DolarAPI, ArgentinaDatos, Binance, CriptoYa, Google Fonts). A new data
  source needs its host added here.
- Also set: `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
  `Permissions-Policy` (camera/microphone/geolocation/payment off), HSTS, an
  immutable long cache for `/assets`, and revalidation for the service worker
  and the PWA manifest.

## Open Graph / Twitter Card image

`public/og-image.png` (1200x630) is what shows up when the link is shared on
LinkedIn, WhatsApp, X or Slack. It is a composed graphic, not a screenshot of
the live app, since the app's data changes constantly and these platforms
cache the preview image for days. If the title, description or card design
changes, regenerate it with:

```bash
npm run og-image
```

`scripts/generate-og-image.mjs` builds an SVG by hand and converts it to PNG
with `sharp`. The text has to match the `<title>` / meta description /
`og:title` / `og:description` in `index.html` (kept separate on purpose, to
avoid coupling the script to HTML parsing).

## SEO

`robots.txt` lives in `public/`. `sitemap.xml` is generated at build time
(see [architecture.md](architecture.md#per-quote-pages-and-seo)) from the
per-quote pages in `src/config/paginas.ts`, so it never needs manual
updates.
