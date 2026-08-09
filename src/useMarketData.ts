import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketQuote, RiesgoPais } from "./types";

const MARKET_KEYS = ["oil", "gold", "spy", "dow", "nasdaq"] as const;

const RIESGO_PAIS_URL = "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo";

type Status = "loading" | "ready" | "error";

interface MarketDataState {
  riesgoPais: { data: RiesgoPais | null; previousValor: number | null; status: Status };
  markets: Record<string, { data: MarketQuote | null; status: Status }>;
}

function initialState(): MarketDataState {
  return {
    riesgoPais: { data: null, previousValor: null, status: "loading" },
    markets: Object.fromEntries(MARKET_KEYS.map((key) => [key, { data: null, status: "loading" as const }])),
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
          setState((prev) => ({
            ...prev,
            riesgoPais: { data, previousValor: previousRiesgoPais.current, status: "ready" },
          }));
          previousRiesgoPais.current = data.valor;
        } catch {
          setState((prev) => ({ ...prev, riesgoPais: { ...prev.riesgoPais, status: "error" } }));
        }
      })(),
      // Un solo pedido a nuestro proxy trae los 5 símbolos juntos (menos créditos gastados en Twelve Data)
      (async () => {
        try {
          const res = await fetch("/api/market");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const payload: Record<string, MarketQuote | null> = await res.json();
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
          setState((prev) => ({
            ...prev,
            markets: Object.fromEntries(
              Object.entries(prev.markets).map(([key, entry]) => [key, { ...entry, status: "error" }])
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
