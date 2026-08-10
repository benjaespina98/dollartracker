// Vercel Edge Function: pide las cotizaciones a Twelve Data (API oficial,
// capa gratuita, requiere key) usando la key del lado del servidor —así
// nunca queda expuesta en el bundle del navegador— y reenvía la respuesta
// simplificada con CORS abierto para que el frontend estático la consuma.
export const config = { runtime: "edge" };

import {
  NO_CACHE,
  SYMBOLS,
  SYMBOL_LIST,
  corsHeaders as headers,
  detectarErrorUpstream,
} from "./_symbols";

// El plan gratuito de Twelve Data da 8 créditos por minuto y 800 por día, y
// cada refresco gasta uno por símbolo. Al sumar soja, maíz y trigo pasamos de
// 5 a 8 símbolos: con la caché de 15 minutos serían 768 créditos diarios, otra
// vez al borde del límite (y el CDN de Vercel cachea por región, así que el
// número real se multiplica). Con 30 minutos quedan ~384, con margen de sobra;
// los mercados están cerrados la mayor parte del día igual. El
// stale-while-revalidate largo hace que el CDN siga sirviendo el último valor
// bueno aunque un refresco puntual falle.
const CACHE_30MIN = "s-maxage=1800, stale-while-revalidate=7200";

function corsHeaders(cacheControl = CACHE_30MIN) {
  return headers(cacheControl);
}

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

  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(SYMBOL_LIST)}&apikey=${apiKey}`;

  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch {
    return new Response(JSON.stringify({ error: "no se pudo contactar Twelve Data" }), {
      status: 502,
      headers: corsHeaders(NO_CACHE),
    });
  }

  const raw: unknown = await upstream.json().catch(() => null);
  const error = detectarErrorUpstream(upstream, raw);
  if (error) {
    return new Response(
      JSON.stringify({
        error: "Twelve Data rechazó el pedido",
        upstreamStatus: error.status,
        upstreamMessage: error.message,
        hint: error.hint,
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
  // respuesta 30 minutos dejaba todas las tarjetas en error aunque el problema
  // ya se hubiera resuelto. El cliente prefiere el 502 y usa su copia local.
  const anyResolved = Object.values(payload).some((value) => value !== null);
  if (!anyResolved) {
    return new Response(JSON.stringify({ error: "Twelve Data no devolvió ninguna cotización" }), {
      status: 502,
      headers: corsHeaders(NO_CACHE),
    });
  }

  return new Response(JSON.stringify(payload), { status: 200, headers: corsHeaders() });
}
