import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketQuote, RiesgoPais } from "./types";

// Símbolos de Yahoo Finance detrás del proxy propio en /api/market (ver api/market.ts)
const MARKET_SYMBOLS: Record<string, string> = {
  oil: "CL=F",
  gold: "GC=F",
  spy: "SPY",
  dow: "^DJI",
  nasdaq: "QQQ",
};

const RIESGO_PAIS_URL = "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo";

type Status = "loading" | "ready" | "error";

interface MarketEntry {
  data: MarketQuote | null;
  status: Status;
}

interface RiesgoPaisEntry {
  data: RiesgoPais | null;
  previousValor: number | null;
  status: Status;
}

export function useMarketData() {
  const [riesgoPais, setRiesgoPais] = useState<RiesgoPaisEntry>({
    data: null,
    previousValor: null,
    status: "loading",
  });
  const [markets, setMarkets] = useState<Record<string, MarketEntry>>(() =>
    Object.fromEntries(Object.keys(MARKET_SYMBOLS).map((key) => [key, { data: null, status: "loading" as const }]))
  );
  const previousRiesgoPais = useRef<number | null>(null);

  const fetchAll = useCallback(async () => {
    setRiesgoPais((prev) => ({ ...prev, status: "loading" }));
    setMarkets((prev) =>
      Object.fromEntries(Object.entries(prev).map(([key, entry]) => [key, { ...entry, status: "loading" }]))
    );

    const riesgoPaisPromise = fetch(RIESGO_PAIS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<RiesgoPais>;
      })
      .then((data) => {
        setRiesgoPais({ data, previousValor: previousRiesgoPais.current, status: "ready" });
        previousRiesgoPais.current = data.valor;
      })
      .catch(() => {
        setRiesgoPais((prev) => ({ ...prev, status: "error" }));
      });

    const marketPromises = Object.entries(MARKET_SYMBOLS).map(async ([key, symbol]) => {
      try {
        const res = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: MarketQuote = await res.json();
        setMarkets((prev) => ({ ...prev, [key]: { data, status: "ready" } }));
      } catch {
        setMarkets((prev) => ({ ...prev, [key]: { ...prev[key], status: "error" } }));
      }
    });

    await Promise.all([riesgoPaisPromise, ...marketPromises]);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { riesgoPais, markets, refresh: fetchAll };
}
