import { NO_CACHE, SYMBOLS, SYMBOL_LIST, corsHeaders, detectarErrorUpstream } from "./_symbols";

// Serie diaria de cada mercado, para los gráficos de las tarjetas.
//
// Cuesta lo mismo que /quote (1 crédito por símbolo), pero las velas diarias
// cambian una vez por día: con 12 horas de caché son ~16 créditos diarios
// contra los 800 del plan gratuito, despreciable frente a los ~384 que gasta
// /api/market. Ojo con el límite de 8 créditos por minuto: este pedido usa
// los 8 de una, así que si cae en el mismo minuto que un refresco de /market
// uno de los dos recibe 429. Es raro (pasa como mucho un par de veces al día)
// y el cliente se recupede solo con su copia en localStorage.
export const config = { runtime: "edge" };

const CACHE_12H = "s-maxage=43200, stale-while-revalidate=86400";
const DIAS = 400;

interface TwelveDataVela {
  datetime: string;
  close: string;
}

interface TwelveDataSerie {
  values?: TwelveDataVela[];
  status?: string;
  code?: number;
  message?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(CACHE_12H) });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Falta configurar TWELVE_DATA_API_KEY en las variables de entorno de Vercel" }),
      { status: 500, headers: corsHeaders(NO_CACHE) }
    );
  }

  const url =
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(SYMBOL_LIST)}` +
    `&interval=1day&outputsize=${DIAS}&apikey=${apiKey}`;

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

  const bySymbol = raw as Record<string, TwelveDataSerie>;
  const payload: Record<string, { fecha: string; valor: number }[]> = {};

  for (const [key, symbol] of Object.entries(SYMBOLS)) {
    const serie = bySymbol[symbol];
    if (!serie?.values?.length) continue;

    const puntos = serie.values
      .map((vela) => ({ fecha: vela.datetime.slice(0, 10), valor: Number(vela.close) }))
      .filter((p) => Number.isFinite(p.valor))
      // Twelve Data devuelve de más nuevo a más viejo; el gráfico necesita
      // el orden cronológico.
      .reverse();

    if (puntos.length >= 2) payload[key] = puntos;
  }

  if (Object.keys(payload).length === 0) {
    return new Response(JSON.stringify({ error: "Twelve Data no devolvió ninguna serie" }), {
      status: 502,
      headers: corsHeaders(NO_CACHE),
    });
  }

  return new Response(JSON.stringify(payload), { status: 200, headers: corsHeaders(CACHE_12H) });
}
