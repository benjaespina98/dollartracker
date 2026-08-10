import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromCache, saveToCache } from "./offlineCache";
import type { MarketQuote, RiesgoPais } from "./types";

const MARKET_KEYS = ["oil", "gold", "spy", "dow", "nasdaq"] as const;

const RIESGO_PAIS_URL = "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo";
const RIESGO_PAIS_CACHE_KEY = "riesgoPais";
const MARKETS_CACHE_KEY = "markets";

export type MarketStatus = "loading" | "ready" | "stale" | "error";

interface MarketDataState {
  riesgoPais: { data: RiesgoPais | null; previousValor: number | null; status: MarketStatus };
  markets: Record<string, { data: MarketQuote | null; status: MarketStatus }>;
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
      // Un solo pedido a nuestro proxy trae los 5 símbolos juntos (menos créditos gastados en Twelve Data)
      (async () => {
        try {
          const res = await fetch("/api/market");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const payload: Record<string, MarketQuote | null> = await res.json();
          saveToCache(MARKETS_CACHE_KEY, payload);
          setState((prev) => ({
            ...prev,
            markets: Object.fromEntries(
              MARKET_KEYS.map((key) => [
                key,
                { data: payload[key] ?? null, status: payload[key] ? "ready" : "error" },
              ])
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
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { riesgoPais: state.riesgoPais, markets: state.markets, refresh: fetchAll };
}
