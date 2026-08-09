// Vercel Edge Function: proxea el endpoint no-oficial de Yahoo Finance
// (que no manda headers CORS) y reenvía solo lo necesario con CORS abierto,
// para que el frontend estático pueda consumirlo directo desde el navegador.
export const config = { runtime: "edge" };

const ALLOWED_SYMBOLS = new Set(["CL=F", "GC=F", "SPY", "^DJI", "QQQ"]);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "s-maxage=60, stale-while-revalidate=180",
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol") ?? "";

  if (!ALLOWED_SYMBOLS.has(symbol)) {
    return new Response(JSON.stringify({ error: "símbolo no permitido" }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=1d&interval=1d`;

  let upstream: Response;
  try {
    upstream = await fetch(yahooUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DollarTrackerBot/1.0)" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "no se pudo contactar la fuente" }), {
      status: 502,
      headers: corsHeaders(),
    });
  }

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: "fuente no disponible" }), {
      status: 502,
      headers: corsHeaders(),
    });
  }

  const data = await upstream.json();
  const meta = data?.chart?.result?.[0]?.meta;

  if (!meta || typeof meta.regularMarketPrice !== "number") {
    return new Response(JSON.stringify({ error: "sin datos para ese símbolo" }), {
      status: 502,
      headers: corsHeaders(),
    });
  }

  const price: number = meta.regularMarketPrice;
  const previousClose: number | null = meta.chartPreviousClose ?? meta.previousClose ?? null;
  const change = previousClose !== null ? price - previousClose : null;
  const changePercent = previousClose ? (change! / previousClose) * 100 : null;

  const payload = {
    symbol: meta.symbol,
    currency: meta.currency ?? "USD",
    price,
    previousClose,
    change,
    changePercent,
    marketTime: meta.regularMarketTime ?? null,
  };

  return new Response(JSON.stringify(payload), { status: 200, headers: corsHeaders() });
}
