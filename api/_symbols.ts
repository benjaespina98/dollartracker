// Compartido por /api/market (precio actual) y /api/history (serie diaria).
// El guion bajo evita que Vercel lo publique como endpoint.
//
// Usamos ETFs líquidos como proxy de cada mercado: son "Stocks/ETFs",
// cubiertos por el plan gratuito de Twelve Data (commodities/índices "puros"
// suelen requerir plan pago).
export const SYMBOLS: Record<string, string> = {
  oil: "USO", // United States Oil Fund → sigue al petróleo WTI
  gold: "GLD", // SPDR Gold Shares → sigue al oro spot
  spy: "SPY", // S&P 500
  dow: "DIA", // SPDR Dow Jones Industrial Average
  nasdaq: "QQQ", // Nasdaq-100
  soja: "SOYB", // Teucrium Soybean Fund → futuros de soja en Chicago
  maiz: "CORN", // Teucrium Corn Fund → futuros de maíz
  trigo: "WEAT", // Teucrium Wheat Fund → futuros de trigo
};

export const SYMBOL_LIST = Object.values(SYMBOLS).join(",");

// El frontend solo llama a estos endpoints con una ruta relativa (mismo
// origen), donde el header de CORS no influye en nada: el navegador jamás lo
// mira para un fetch same-origin. Un "*" acá no habilita a la app, solo deja
// que cualquier otro sitio incruste este proxy en el suyo y gaste, gratis, los
// créditos compartidos de Twelve Data (8/min, 800/día). Reflejar el origen
// solo si está en esta lista mantiene la app intacta (local, preview y
// producción) y bloquea el resto.
const ALLOWED_ORIGINS = new Set([
  "https://dollartracker.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

export function corsHeaders(cacheControl: string, origin?: string | null) {
  // Sin "Vary: Origin" a propósito: el CDN cachea una sola respuesta por URL
  // (la base de los cálculos de crédito en market.ts/history.ts) y este header
  // va parejo con eso. Si un pedido con un origen no permitido llega a
  // computar la respuesta que queda en caché, lo peor que pasa es que ese
  // Access-Control-Allow-Origin quede pisado hasta el próximo refresco: el
  // navegador igual exige que coincida con el origen real de quien pide, así
  // que ningún tercero gana acceso por ese cache compartido.
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": cacheControl,
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

// Los errores no se cachean: si no, un 429 puntual se congelaba en el CDN.
export const NO_CACHE = "no-store";

/**
 * Twelve Data informa los fallos de dos formas: con un status HTTP (401 key
 * inválida, 429 sin créditos) o con HTTP 200 y un objeto { code, message } en
 * el cuerpo. Devuelve el detalle para que se pueda diagnosticar desde el
 * navegador en vez de un 502 opaco.
 */
export function detectarErrorUpstream(
  upstream: Response,
  raw: unknown
): { status: number; message: string; hint?: string } | null {
  const error = raw as { code?: number; message?: string; status?: string } | null;
  const esError = !upstream.ok || error?.status === "error" || (error?.code != null && error.code >= 400);
  if (!esError) return null;

  const status = error?.code ?? upstream.status;
  return {
    status,
    message: error?.message ?? upstream.statusText,
    hint:
      status === 401
        ? "La API key es inválida o no está bien cargada en Vercel (Settings → Environment Variables → TWELVE_DATA_API_KEY). Recordá redeployar después de cambiarla."
        : status === 429
          ? "Se agotaron los créditos del plan gratuito de Twelve Data (8 por minuto / 800 por día). Cada pedido gasta uno por símbolo."
          : undefined,
  };
}
