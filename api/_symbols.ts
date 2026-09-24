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

const TIMEOUT_UPSTREAM_MS = 8000;

function json(body: unknown, status: number, cacheControl: string, origin?: string | null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(cacheControl, origin) });
}

/**
 * Validaciones previas al pedido a Twelve Data. Los endpoints no reciben
 * parámetros (los símbolos son fijos), así que cualquier query string es ruido
 * o un intento de esquivar la caché del CDN —que cachea por URL completa— para
 * que cada pedido gaste créditos: se rechaza sin tocar al proveedor.
 */
export function validarPedido(req: Request, cacheOk: string): Response | null {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(cacheOk, origin) });
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return json({ error: "método no permitido" }, 405, NO_CACHE, origin);
  }
  if (new URL(req.url).search !== "") {
    return json({ error: "este endpoint no acepta parámetros" }, 400, NO_CACHE, origin);
  }
  return null;
}

export type ResultadoUpstream = { ok: true; raw: unknown } | { ok: false; response: Response };

/**
 * Pide `url` a Twelve Data con timeout y devuelve el JSON, o una respuesta de
 * error ya armada. Al cliente nunca le llega el mensaje del proveedor ni la
 * URL (lleva la API key): el detalle va solo a los logs del servidor.
 */
export async function pedirATwelveData(url: string, req: Request): Promise<ResultadoUpstream> {
  const origin = req.headers.get("origin");
  const fallo = (status: number, error: string, motivo?: string) => ({
    ok: false as const,
    response: json(motivo ? { error, motivo } : { error }, status, NO_CACHE, origin),
  });

  let upstream: Response;
  try {
    upstream = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_UPSTREAM_MS) });
  } catch {
    console.error("[proxy] Twelve Data no respondió (red o timeout)");
    return fallo(502, "no se pudo contactar al proveedor de datos");
  }

  const raw: unknown = await upstream.json().catch(() => null);
  const error = detectarErrorUpstream(upstream, raw);
  if (error) {
    console.error(`[proxy] Twelve Data devolvió un error (código ${error.status})`);
    return error.status === 429
      ? fallo(502, "el proveedor de datos alcanzó su límite", "limite_de_cuota")
      : fallo(502, "el proveedor de datos rechazó el pedido");
  }
  return { ok: true, raw };
}

/**
 * Twelve Data informa los fallos de dos formas: con un status HTTP (401 key
 * inválida, 429 sin créditos) o con HTTP 200 y un objeto { code, message } en
 * el cuerpo.
 */
export function detectarErrorUpstream(upstream: Response, raw: unknown): { status: number } | null {
  const error = raw as { code?: number; status?: string } | null;
  const esError = !upstream.ok || error?.status === "error" || (error?.code != null && error.code >= 400);
  return esError ? { status: error?.code ?? upstream.status } : null;
}

/** Que la respuesta del proveedor sea un objeto antes de indexarla por símbolo. */
export function comoObjeto<T>(raw: unknown): Record<string, T> | null {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, T>) : null;
}
