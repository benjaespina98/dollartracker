// Vercel Edge Function: pide las cotizaciones a Twelve Data (API oficial,
// capa gratuita, requiere key) usando la key del lado del servidor —así
// nunca queda expuesta en el bundle del navegador— y reenvía la respuesta
// simplificada con CORS abierto para que el frontend estático la consuma.
export const config = { runtime: "edge" };

// Usamos ETFs líquidos como proxy de cada mercado: son "Stocks/ETFs",
// cubiertos por el plan gratuito de Twelve Data (commodities/índices "puros"
// suelen requerir plan pago).
const SYMBOLS: Record<string, string> = {
  oil: "USO", // United States Oil Fund → sigue al petróleo WTI
  gold: "GLD", // SPDR Gold Shares → sigue al oro spot
  spy: "SPY", // S&P 500
  dow: "DIA", // SPDR Dow Jones Industrial Average
  nasdaq: "QQQ", // Nasdaq-100
};

// El plan gratuito de Twelve Data da 8 créditos por minuto y 800 por día, y
// cada refresco gasta 5 (uno por símbolo). Con 10 minutos de caché eran hasta
// 720 créditos diarios: al borde del límite, y cualquier pico dejaba las
// tarjetas sin datos el resto del día. Con 15 minutos bajamos a ~480, y el
// stale-while-revalidate largo hace que el CDN siga sirviendo el último valor
// bueno aunque un refresco puntual falle.
function corsHeaders(cacheControl = "s-maxage=900, stale-while-revalidate=3600") {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": cacheControl,
  };
}

// Los errores no se cachean: si no, un 429 puntual se congelaba en el CDN.
const NO_CACHE = "no-store";

interface TwelveDataQuote {
  symbol: string;
  currency?: string;
  close?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  timestamp?: number;
  datetime?: string;
  code?: number;
  message?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Falta configurar TWELVE_DATA_API_KEY en las variables de entorno de Vercel" }),
      { status: 500, headers: corsHeaders(NO_CACHE) }
    );
  }

  const symbolList = Object.values(SYMBOLS).join(",");
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbolList)}&apikey=${apiKey}`;

  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch {
    return new Response(JSON.stringify({ error: "no se pudo contactar Twelve Data" }), {
      status: 502,
      headers: corsHeaders(NO_CACHE),
    });
  }

  // Twelve Data informa los fallos de dos formas distintas: con un status HTTP
  // (401 key inválida, 429 sin créditos) o con HTTP 200 y un objeto
  // { code, message } en el cuerpo. Hay que leer el cuerpo en ambos casos:
  // devolver un 502 genérico deja el problema imposible de diagnosticar desde
  // el navegador, que es justo lo que pasaba cuando las tarjetas quedaban vacías.
  const raw: unknown = await upstream.json().catch(() => null);
  const rawError = raw as { code?: number; message?: string; status?: string } | null;

  if (!upstream.ok || rawError?.status === "error" || (rawError?.code && rawError.code >= 400)) {
    const status = rawError?.code ?? upstream.status;
    return new Response(
      JSON.stringify({
        error: "Twelve Data rechazó el pedido",
        upstreamStatus: status,
        upstreamMessage: rawError?.message ?? upstream.statusText,
        hint:
          status === 401
            ? "La API key es inválida o no está bien cargada en Vercel (Settings → Environment Variables → TWELVE_DATA_API_KEY). Recordá redeployar después de cambiarla."
            : status === 429
              ? "Se agotaron los créditos del plan gratuito de Twelve Data (8 por minuto / 800 por día). Cada refresco gasta 5, uno por símbolo."
              : undefined,
      }),
      { status: 502, headers: corsHeaders(NO_CACHE) }
    );
  }

  // Con más de un símbolo, Twelve Data devuelve un objeto keyed por símbolo.
  const bySymbol = raw as Record<string, TwelveDataQuote>;

  const payload: Record<string, unknown> = {};

  for (const [key, symbol] of Object.entries(SYMBOLS)) {
    const quote = bySymbol[symbol];
    if (!quote || quote.code || !quote.close) {
      payload[key] = null;
      continue;
    }

    const price = Number(quote.close);
    const previousClose = quote.previous_close !== undefined ? Number(quote.previous_close) : null;
    const change = quote.change !== undefined ? Number(quote.change) : null;
    const changePercent = quote.percent_change !== undefined ? Number(quote.percent_change) : null;

    payload[key] = {
      symbol: quote.symbol,
      currency: quote.currency ?? "USD",
      price,
      previousClose,
      change,
      changePercent,
      marketTime: quote.timestamp ?? null,
    };
  }

  // Si no salvamos ni un símbolo fue un fallo, no un resultado: cachear esa
  // respuesta 15 minutos dejaba todas las tarjetas en error aunque el problema
  // ya se hubiera resuelto. El cliente prefiere el 502 y usa su copia local.
  const anyResolved = Object.values(payload).some((value) => value !== null);
  if (!anyResolved) {
    return new Response(
      JSON.stringify({ error: "Twelve Data no devolvió ninguna cotización", upstreamMessage: rawError?.message }),
      { status: 502, headers: corsHeaders(NO_CACHE) }
    );
  }

  return new Response(JSON.stringify(payload), { status: 200, headers: corsHeaders() });
}
