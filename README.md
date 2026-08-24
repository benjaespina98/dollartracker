# DollarTracker

PWA en React + Vite con las cotizaciones del dólar, el euro y el real en
Argentina, el riesgo país y una selección de mercados internacionales, todo en
una sola pantalla y con su histórico.

🔗 https://dollartracker.vercel.app/

## Qué muestra

- **Dólar**: oficial, blue, MEP, CCL, cripto y tarjeta (DolarAPI).
- **Otras monedas**: euro y real brasileño (DolarAPI).
- **Mercados**: riesgo país (ArgentinaDatos), petróleo, oro, S&P 500, Dow Jones
  y Nasdaq, vía ETFs de referencia (Twelve Data).
- **Granos**: soja, maíz y trigo, vía los ETFs de Teucrium.

Cada tarjeta se toca para abrir su histórico (7d / 30d / 90d / 1 año) y se
puede compartir o copiar. El cotizador de arriba convierte un monto contra
todas las cotizaciones a la vez, usando la punta de compra o de venta según
corresponda.

## Cómo funciona

- Sin backend propio ni cuentas: los cálculos se hacen en el dispositivo.
- El último dato bueno queda en `localStorage`, así que sin conexión la app
  sigue mostrando información (marcada como tal) en vez de un error.
- Dos Edge Functions en Vercel (`api/market`, `api/history`) hacen de proxy de
  Twelve Data para no exponer la API key y para cachear en el CDN, que es lo
  que mantiene el consumo dentro del plan gratuito.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm test         # vitest
npm run build    # tsc -b + vite build
npm run lint
```

Las tarjetas de mercados necesitan `TWELVE_DATA_API_KEY` como variable de
entorno en Vercel; el resto de la app funciona sin ninguna key.

## Estado

Proyecto personal.
