import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromCache, saveToCache } from "./offlineCache";
import type { Cotizacion } from "./types";

const ENDPOINTS: Record<string, string> = {
  oficial: "https://dolarapi.com/v1/dolares/oficial",
  blue: "https://dolarapi.com/v1/dolares/blue",
  bolsa: "https://dolarapi.com/v1/dolares/bolsa",
  contadoconliqui: "https://dolarapi.com/v1/dolares/contadoconliqui",
  cripto: "https://dolarapi.com/v1/dolares/cripto",
  tarjeta: "https://dolarapi.com/v1/dolares/tarjeta",
  eur_oficial: "https://dolarapi.com/v1/cotizaciones/eur",
  brl_oficial: "https://dolarapi.com/v1/cotizaciones/brl",
};

export type CotizacionStatus = "loading" | "ready" | "stale" | "error";

export type CotizacionesState = Record<
  string,
  { data: Cotizacion | null; previousVenta: number | null; status: CotizacionStatus }
>;

export function useCotizaciones() {
  const [state, setState] = useState<CotizacionesState>(() =>
    Object.fromEntries(
      Object.keys(ENDPOINTS).map((key) => [
        key,
        { data: loadFromCache<Cotizacion>(key), previousVenta: null, status: "loading" as const },
      ])
    )
  );
  const previousValues = useRef<Record<string, number>>({});

  const fetchAll = useCallback(async () => {
    setState((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(ENDPOINTS)) {
        next[key] = { ...next[key], status: "loading" };
      }
      return next;
    });

    await Promise.all(
      Object.entries(ENDPOINTS).map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: Cotizacion = await res.json();
          saveToCache(key, data);
          setState((prev) => ({
            ...prev,
            [key]: {
              data,
              previousVenta: previousValues.current[key] ?? null,
              status: "ready",
            },
          }));
          previousValues.current[key] = data.venta;
        } catch {
          const cached = loadFromCache<Cotizacion>(key);
          setState((prev) => ({
            ...prev,
            [key]: cached
              ? { data: cached, previousVenta: previousValues.current[key] ?? null, status: "stale" }
              : { ...prev[key], status: "error" },
          }));
        }
      })
    );
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { state, refresh: fetchAll };
}
