import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromCache, saveToCache } from "../lib/offlineCache";
import type { MarketQuote, RiesgoPais } from "../types";
import { ESPERA_CUPO_MS } from "./useHistorico";
import { estaOffline, fetchResource, type ResourceEntry, type ResourceStatus } from "./useResource";

const MARKET_KEYS = ["oil", "gold", "spy", "dow", "nasdaq", "soja", "maiz", "trigo"] as const;

const RIESGO_PAIS_URL = "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo";
const RIESGO_PAIS_CACHE_KEY = "riesgoPais";
const MARKETS_CACHE_KEY = "markets";

export type MarketStatus = ResourceStatus;

interface MarketDataState {
  riesgoPais: ResourceEntry<RiesgoPais>;
  markets: Record<string, ResourceEntry<MarketQuote>>;
}

async function pedirRiesgoPais(signal: AbortSignal): Promise<RiesgoPais> {
  const res = await fetch(RIESGO_PAIS_URL, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function pedirMercado(signal: AbortSignal): Promise<Record<string, MarketQuote | null>> {
  const res = await fetch("/api/market", { signal });
  if (!res.ok) {
    // El proxy manda el motivo concreto en el cuerpo (key inválida, sin
    // créditos, con su pista). Sin esto la única señal es un "No se pudo
    // obtener el dato" en la tarjeta, que no dice nada.
    console.warn("[DollarTracker] /api/market falló:", res.status, await res.json().catch(() => null));
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

function esperar(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      resolve();
    });
  });
}

interface ResultadoMercados {
  /** Lo que respondió Twelve Data en esta tanda; null en un símbolo que no resolvió */
  payload: Record<string, MarketQuote | null>;
  /** `payload` completado con el último valor bueno del cache donde faltó */
  merged: Record<string, MarketQuote | null>;
}

// El fetch de mercados no encaja en fetchResource tal cual: Twelve Data puede
// resolver algunos símbolos y otros no, así que mergeamos con el último cache
// bueno símbolo por símbolo (para que uno que falló hoy no borre el último
// valor bueno que sí habíamos traído) y reintentamos una vez si chocamos con
// el límite de 8 créditos por minuto (ver useHistorico.ESPERA_CUPO_MS).
async function fetchMercados(signal: AbortSignal): Promise<ResultadoMercados> {
  let payload: Record<string, MarketQuote | null>;
  try {
    payload = await pedirMercado(signal);
  } catch {
    await esperar(ESPERA_CUPO_MS, signal);
    if (signal.aborted) throw new Error("abortado");
    payload = await pedirMercado(signal);
  }

  const cached = loadFromCache<Record<string, MarketQuote | null>>(MARKETS_CACHE_KEY)?.data ?? {};
  const merged = Object.fromEntries(MARKET_KEYS.map((key) => [key, payload[key] ?? cached[key] ?? null]));
  return { payload, merged };
}

function initialState(): MarketDataState {
  const cachedRiesgo = loadFromCache<RiesgoPais>(RIESGO_PAIS_CACHE_KEY);
  const cachedMarkets = loadFromCache<Record<string, MarketQuote | null>>(MARKETS_CACHE_KEY)?.data ?? {};
  return {
    riesgoPais: { data: cachedRiesgo?.data ?? null, status: "loading", savedAt: cachedRiesgo?.savedAt ?? null },
    markets: Object.fromEntries(
      MARKET_KEYS.map((key) => [
        key,
        { data: cachedMarkets[key] ?? null, status: "loading" as const, savedAt: null },
      ])
    ),
  };
}

export function useMarketData() {
  const [state, setState] = useState<MarketDataState>(initialState);
  // Dos AbortController separados: riesgo país y mercados salen en paralelo
  // pero son pedidos independientes, así que cada uno cancela solo el suyo.
  const riesgoControllerRef = useRef<AbortController | null>(null);
  const marketsControllerRef = useRef<AbortController | null>(null);

  const fetchAll = useCallback(async () => {
    riesgoControllerRef.current?.abort();
    marketsControllerRef.current?.abort();
    const riesgoController = new AbortController();
    const marketsController = new AbortController();
    riesgoControllerRef.current = riesgoController;
    marketsControllerRef.current = marketsController;

    setState((prev) => ({
      riesgoPais: { ...prev.riesgoPais, status: "loading" },
      markets: Object.fromEntries(
        Object.entries(prev.markets).map(([key, entry]) => [key, { ...entry, status: "loading" }])
      ),
    }));

    await Promise.all([
      (async () => {
        const entry = await fetchResource<RiesgoPais>(
          RIESGO_PAIS_CACHE_KEY,
          pedirRiesgoPais,
          riesgoController.signal
        );
        if (riesgoController.signal.aborted) return;
        setState((prev) => ({ ...prev, riesgoPais: entry }));
      })(),
      (async () => {
        if (estaOffline()) {
          const cached = loadFromCache<Record<string, MarketQuote | null>>(MARKETS_CACHE_KEY);
          setState((prev) => ({
            ...prev,
            markets: Object.fromEntries(
              MARKET_KEYS.map((key) => {
                const valor = cached?.data[key];
                return [
                  key,
                  valor
                    ? { data: valor, status: "stale" as const, savedAt: cached!.savedAt }
                    : { data: null, status: "error" as const, savedAt: null },
                ];
              })
            ),
          }));
          return;
        }

        try {
          const { payload, merged } = await fetchMercados(marketsController.signal);
          if (marketsController.signal.aborted) return;

          const savedAt = saveToCache(MARKETS_CACHE_KEY, merged);
          setState((prev) => ({
            ...prev,
            markets: Object.fromEntries(
              MARKET_KEYS.map((key) => {
                // payload trae null en el símbolo que Twelve Data no resolvió
                // en esta tanda; merged ya lo completó con el cache. Un
                // símbolo puede quedar "stale" aunque el resto de la tanda
                // haya salido bien.
                if (payload[key]) return [key, { data: payload[key], status: "ready" as const, savedAt }];
                return [
                  key,
                  merged[key]
                    ? { data: merged[key], status: "stale" as const, savedAt }
                    : { data: null, status: "error" as const, savedAt: null },
                ];
              })
            ),
          }));
        } catch {
          if (marketsController.signal.aborted) return;
          const cached = loadFromCache<Record<string, MarketQuote | null>>(MARKETS_CACHE_KEY);
          setState((prev) => ({
            ...prev,
            markets: Object.fromEntries(
              MARKET_KEYS.map((key) => {
                const valor = cached?.data[key];
                return [
                  key,
                  valor
                    ? { data: valor, status: "stale" as const, savedAt: cached!.savedAt }
                    : { ...prev.markets[key], status: "error" as const },
                ];
              })
            ),
          }));
        }
      })(),
    ]);
  }, []);

  useEffect(() => {
    // Falso positivo de react-hooks/set-state-in-effect: fetchAll toca los
    // refs de los AbortController antes de actualizar el estado, que es el
    // patrón de cancelación que documenta React (ver el mismo comentario en
    // useResource).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    // Cada 15 min: el proxy cachea 30 en el CDN, así que refrescar más seguido
    // no trae datos nuevos y solo gasta créditos del plan gratuito.
    const interval = setInterval(fetchAll, 15 * 60 * 1000);
    return () => {
      clearInterval(interval);
      riesgoControllerRef.current?.abort();
      marketsControllerRef.current?.abort();
    };
  }, [fetchAll]);

  return { riesgoPais: state.riesgoPais, markets: state.markets, refresh: fetchAll };
}
