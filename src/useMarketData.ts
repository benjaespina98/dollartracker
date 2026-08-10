import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromCache, saveToCache } from "./offlineCache";
import { ESPERA_CUPO_MS } from "./useHistorico";
import type { MarketQuote, RiesgoPais } from "./types";

const MARKET_KEYS = ["oil", "gold", "spy", "dow", "nasdaq", "soja", "maiz", "trigo"] as const;

const RIESGO_PAIS_URL = "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo";
const RIESGO_PAIS_CACHE_KEY = "riesgoPais";
const MARKETS_CACHE_KEY = "markets";

export type MarketStatus = "loading" | "ready" | "stale" | "error";

interface MarketDataState {
  riesgoPais: { data: RiesgoPais | null; previousValor: number | null; status: MarketStatus };
  markets: Record<string, { data: MarketQuote | null; status: MarketStatus }>;
}

async function pedirMercado(): Promise<Record<string, MarketQuote | null>> {
  const res = await fetch("/api/market");
  if (!res.ok) {
    // El proxy manda el motivo concreto en el cuerpo (key inválida, sin
    // créditos, con su pista). Sin esto la única señal es un "No se pudo
    // obtener el dato" en la tarjeta, que no dice nada.
    console.warn("[DollarTracker] /api/market falló:", res.status, await res.json().catch(() => null));
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

function initialState(): MarketDataState {
  const cachedMarkets = loadFromCache<Record<string, MarketQuote | null>>(MARKETS_CACHE_KEY) ?? {};
  return {
    riesgoPais: {
      data: loadFromCache<RiesgoPais>(RIESGO_PAIS_CACHE_KEY),
      previousValor: null,
      status: "loading",
    },
    markets: Object.fromEntries(
      MARKET_KEYS.map((key) => [key, { data: cachedMarkets[key] ?? null, status: "loading" as const }])
    ),
  };
}

export function useMarketData() {
  const [state, setState] = useState<MarketDataState>(initialState);
  const previousRiesgoPais = useRef<number | null>(null);

  const fetchAll = useCallback(async () => {
    setState((prev) => ({
      riesgoPais: { ...prev.riesgoPais, status: "loading" },
      markets: Object.fromEntries(
        Object.entries(prev.markets).map(([key, entry]) => [key, { ...entry, status: "loading" }])
      ),
    }));

    await Promise.all([
      (async () => {
        try {
          const res = await fetch(RIESGO_PAIS_URL);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: RiesgoPais = await res.json();
          saveToCache(RIESGO_PAIS_CACHE_KEY, data);
          setState((prev) => ({
            ...prev,
            riesgoPais: { data, previousValor: previousRiesgoPais.current, status: "ready" },
          }));
          previousRiesgoPais.current = data.valor;
        } catch {
          const cached = loadFromCache<RiesgoPais>(RIESGO_PAIS_CACHE_KEY);
          setState((prev) => ({
            ...prev,
            riesgoPais: cached
              ? { data: cached, previousValor: previousRiesgoPais.current, status: "stale" }
              : { ...prev.riesgoPais, status: "error" },
          }));
        }
      })(),
      // Un solo pedido a nuestro proxy trae los 8 símbolos juntos (menos créditos gastados en Twelve Data)
      (async () => {
        try {
          let payload: Record<string, MarketQuote | null>;
          try {
            payload = await pedirMercado();
          } catch {
            // Puede haber chocado con /api/history contra el límite de 8
            // créditos por minuto de Twelve Data; al minuto se renueva el cupo.
            await new Promise((resolve) => setTimeout(resolve, ESPERA_CUPO_MS));
            payload = await pedirMercado();
          }
          // Twelve Data puede resolver algunos símbolos y otros no. Guardamos
          // el merge con lo que ya teníamos para que un símbolo que falló hoy
          // no borre del cache el último valor bueno que sí habíamos traído.
          const cached = loadFromCache<Record<string, MarketQuote | null>>(MARKETS_CACHE_KEY) ?? {};
          const merged = Object.fromEntries(
            MARKET_KEYS.map((key) => [key, payload[key] ?? cached[key] ?? null])
          );
          saveToCache(MARKETS_CACHE_KEY, merged);
          setState((prev) => ({
            ...prev,
            markets: Object.fromEntries(
              MARKET_KEYS.map((key) => {
                if (payload[key]) return [key, { data: payload[key], status: "ready" as const }];
                const fallback = cached[key];
                return [
                  key,
                  fallback ? { data: fallback, status: "stale" as const } : { data: null, status: "error" as const },
                ];
              })
            ),
          }));
        } catch {
          const cached = loadFromCache<Record<string, MarketQuote | null>>(MARKETS_CACHE_KEY);
          setState((prev) => ({
            ...prev,
            markets: Object.fromEntries(
              MARKET_KEYS.map((key) => {
                const cachedValue = cached?.[key];
                return [
                  key,
                  cachedValue ? { data: cachedValue, status: "stale" as const } : { ...prev.markets[key], status: "error" },
                ];
              })
            ),
          }));
        }
      })(),
    ]);
  }, []);

  useEffect(() => {
    fetchAll();
    // Cada 15 min: el proxy cachea 30 en el CDN, así que refrescar más seguido
    // no trae datos nuevos y solo gasta créditos del plan gratuito.
    const interval = setInterval(fetchAll, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { riesgoPais: state.riesgoPais, markets: state.markets, refresh: fetchAll };
}
