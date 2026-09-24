# POLISH_REPORT

Rama: `chore/polish-2026-09-24` (sin push ni merge). Alcance recortado por pedido: solo los puntos 1 a 4 de la prioridad; el resto queda como propuesta.

## Línea base
Tests 86 ✔ · lint ✔ · tsc + build ✔ · bundle JS 242,84 kB (76,50 kB gzip). Sin Lighthouse (no se corrió).

## Final
Tests 96 ✔ · lint ✔ · tsc + build ✔ · bundle JS 243,55 kB (76,79 kB gzip). Sin secretos en el código ni en el historial revisado con búsqueda dirigida.

## Cambios
**Edge Functions (`api/`)**
- Rechazan métodos distintos de GET/HEAD (405) y cualquier query string (400): los endpoints no reciben parámetros y, como el CDN cachea por URL, un `?x=random` permitía saltear la caché y gastar créditos de Twelve Data. Los símbolos siguen siendo una lista blanca fija.
- Timeout de 8 s al proveedor. Los errores ya no devuelven el mensaje del proveedor ni pistas de configuración: solo un texto genérico (y `motivo: "limite_de_cuota"` ante 429). El detalle va a los logs del servidor, sin la URL (lleva la key).
- Se valida que la respuesta sea un objeto. Helpers compartidos en `api/_symbols.ts`. Cachés sin cambios (30 min y 12 h, con stale-while-revalidate); los errores siguen en `no-store`.

**Seguridad (`vercel.json`)**: CSP (script con hash del script inline del tema, estilos inline por los `style=` de React, fuentes de Google, `connect-src` a DolarAPI y ArgentinaDatos, `blob:`/`data:` para imágenes, worker propio), nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy, HSTS, caché inmutable para `/assets` y revalidación para `sw.js` y el manifest.
**Resiliencia**: `src/lib/http.ts` (timeout por intento, 2 reintentos con backoff ante red/5xx/429, validación de forma). Aplicado a cotizaciones, riesgo país y mercados; cada fuente sigue fallando por separado con su copia en localStorage. Se quitó un `console.warn`.
**SEO**: description mejorada, canonical, robots, og:site_name/alt, JSON-LD `WebApplication`, `display=swap` en las fuentes, `robots.txt` y `sitemap.xml`.

## Decisiones / riesgos
- La CSP no se probó en un navegador contra el deploy: **verificar en un preview de Vercel** (consola sin violaciones, gráficos, compartir imagen, service worker, analytics). El hash del script inline coincide con el del build, pero hay que regenerarlo si se edita ese script.
- Se perdió el diagnóstico visible desde el navegador de key inválida o sin créditos; ahora se ve en los logs de Vercel.

## No hecho (propuestas, por impacto)
1. Verificar CSP en preview y correr Lighthouse (base y final; no se hizo).
2. Analítica: ya está `@vercel/analytics` (pendiente activarlo en el dashboard). No informa visitantes recurrentes con detalle; evaluar Plausible. Falta un interruptor por variable de entorno.
3. Páginas indexables (`/dolar-blue`, `/dolar-mep`): requiere prerender o rewrites; es un cambio grande. Es lo que más ayudaría al tráfico orgánico.
4. Open Graph dinámico (Edge Function con imagen) para compartir cotizaciones.
5. Rendimiento: lazy loading del histórico/gráficos, revisar service worker y CLS/LCP.
6. Tests de `offlineCache` y de la ruta de `useHistorico`; validar también `/api/history` y ArgentinaDatos en el cliente.
7. Indicador de dato desactualizado ya existe (`savedAt`); revisar si conviene mostrar la hora exacta.
8. README: documentar la CSP, la restricción de query strings y las variables de entorno.
