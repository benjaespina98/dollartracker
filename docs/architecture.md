# Architecture

## Overview

DollarTracker is a React 19 + TypeScript single-page app, built with Vite and
served as a static site with a Vercel PWA. It has no database and no user
accounts: it reads public market data, does all calculations on the device,
and keeps the last good value per source in `localStorage` so the app still
shows data (marked as such) when offline or when a source fails.

## Data sources

| Data | Source | Notes |
| --- | --- | --- |
| Dollar (oficial, blue, MEP, CCL, cripto, tarjeta) | [DolarAPI](https://dolarapi.com) | No key required |
| Euro, Brazilian real | DolarAPI | No key required |
| Country risk | [ArgentinaDatos](https://argentinadatos.com) | No key required |
| Oil, S&P 500, Dow Jones, Nasdaq, Ibovespa, Merval, soybean, corn | [Twelve Data](https://twelvedata.com) (ETF proxies) | Proxied through `api/market.ts` and `api/history.ts`, server-side key |
| Gold, BTC, ETH, SOL, XRP | [Binance](https://www.binance.com) public API | No key required, called directly from the client |

Each card fetches, validates and caches its own data independently
(`src/lib/http.ts`): 8 second timeout per attempt, 2 retries with exponential
backoff on network errors, timeouts, 5xx and 429, and no retry on other 4xx.
A source failing does not affect the others.

## Edge Functions (`api/`)

`api/market.ts` and `api/history.ts` run as Vercel Edge Functions and proxy
Twelve Data so the API key never reaches the browser, and so responses can be
cached at the CDN (30 minutes for quotes, 12 hours for history, with
stale-while-revalidate). They only accept `GET`/`HEAD` with no query string:
a free-form query would bypass the CDN cache and burn through Twelve Data's
free-tier credits (8 per minute). The symbol list is a fixed allowlist
(`api/_symbols.ts`). Errors return a generic message; details stay in the
Vercel function logs.

## Per-quote pages and SEO

`src/config/paginas.ts` defines one entry per quote (slug, title, meta
description, intro text). At build time, `vite.config.ts` renders a static
`dist/<slug>/index.html` for each one (same app, different `<title>`/
`<meta>`/intro) and writes `dist/sitemap.xml`. Inside the app, navigating
between these pages uses the History API (instant, no reload); a cold visit
or an external link still gets the pre-rendered HTML.

## Client-side caching and offline support

`src/lib/offlineCache.ts` stores the last successful value per resource under
a `dollartracker:cache:` prefix in `localStorage`, together with the
timestamp it was saved. On a failed fetch, the UI falls back to that value
and marks it as stale instead of showing an error.

The app is a PWA (`vite-plugin-pwa`, `generateSW` mode): a service worker
precaches the app shell for offline use, while API calls stay
network-only (`workbox.runtimeCaching`) so quotes are never served stale from
the service worker cache — only from the `localStorage` fallback above.

## Testing

Unit and component tests run on Vitest (`npm test`), covering: currency
conversion math, response validation and retry logic (`src/lib/http.ts`),
offline cache, favorites, swipe/drag gestures, date formatting, the
historical-data hooks, and the main UI components (cards, error boundary,
sparklines, expanded panels).
