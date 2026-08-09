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

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "s-maxage=600, stale-while-revalidate=300",
  };
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
      { status: 500, headers: corsHeaders() }
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
      headers: corsHeaders(),
    });
  }

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: "Twelve Data no disponible" }), {
      status: 502,
      headers: corsHeaders(),
    });
  }

  const raw = await upstream.json();
  // Con más de un símbolo, Twelve Data devuelve un objeto keyed por símbolo.
  const bySymbol: Record<string, TwelveDataQuote> =
    Object.keys(SYMBOLS).length > 1 ? raw : { [symbolList]: raw };

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

  return new Response(JSON.stringify(payload), { status: 200, headers: corsHeaders() });
}
