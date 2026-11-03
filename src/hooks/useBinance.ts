import { useCallback, useEffect, useRef, useState } from "react";
import { aCotizacionBinance, aSerieBitcoin, binanceKlinesUrl, binanceTickerUrl, esTicker24h } from "../lib/bitcoin";
import { pedirJson } from "../lib/http";
import { hoyEnArgentina } from "../lib/fechas";
import { loadFromCache, saveToCache } from "../lib/offlineCache";
import type { MarketQuote } from "../types";
import { fetchResource, type ResourceEntry } from "./useResource";
import type { SeriePunto } from "./useHistorico";

/** Un activo que sale de Binance: la clave de la tarjeta y su par (por ejemplo BTCUSDT). */
export interface ActivoBinance {
  key: string;
  symbol: string;
}

const REFRESCO_MS = 60_000;

/**
 * Precios de varios activos de Binance, cada uno con su propio caché local y
 * su estado (cargando / listo / desactualizado / error), igual que los demás
 * recursos de la app. Se refrescan juntos cada minuto.
 */
export function useBinanceQuotes(activos: ActivoBinance[]) {
  const [quotes, setQuotes] = useState<Record<string, ResourceEntry<MarketQuote>>>(() =>
    Object.fromEntries(
      activos.map(({ key }) => {
        const cached = loadFromCache<MarketQuote>(`binance:${key}`);
        return [key, { data: cached?.data ?? null, status: "loading" as const, savedAt: cached?.savedAt ?? null }];
      })
    )
  );
  const controladorRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;

    await Promise.all(
      activos.map(async ({ key, symbol }) => {
        const entry = await fetchResource<MarketQuote>(
          `binance:${key}`,
          async (signal) => aCotizacionBinance(await pedirJson(binanceTickerUrl(symbol), signal, esTicker24h), symbol),
          controlador.signal
        );
        if (controlador.signal.aborted) return;
        setQuotes((prev) => ({ ...prev, [key]: entry }));
      })
    );
    // activos no cambia durante la vida de la app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESCO_MS);
    return () => {
      clearInterval(interval);
      controladorRef.current?.abort();
    };
  }, [refresh]);

  return { quotes, refresh };
}

interface CacheSerie {
  fetchedAt: string;
  puntos: SeriePunto[];
}

/**
 * Histórico diario de cada activo de Binance (un año de cierres). Se pide una
 * vez por día y queda en caché local; sin histórico la tarjeta solo no muestra gráfico.
 */
export function useHistoricoBinance(activos: ActivoBinance[]): Record<string, SeriePunto[] | null> {
  const [series, setSeries] = useState<Record<string, SeriePunto[] | null>>({});

  useEffect(() => {
    let vigente = true;
    for (const { key, symbol } of activos) {
      const clave = `hist:binance:${key}`;
      const cached = loadFromCache<CacheSerie>(clave)?.data;
      if (cached?.fetchedAt === hoyEnArgentina() && cached.puntos.length > 0) {
        setSeries((prev) => ({ ...prev, [key]: cached.puntos }));
        continue;
      }
      pedirJson(binanceKlinesUrl(symbol), new AbortController().signal, (d): d is unknown[] => Array.isArray(d))
        .then((velas) => {
          const puntos = aSerieBitcoin(velas);
          saveToCache<CacheSerie>(clave, { fetchedAt: hoyEnArgentina(), puntos });
          if (vigente) setSeries((prev) => ({ ...prev, [key]: puntos }));
        })
        .catch(() => {
          if (vigente) setSeries((prev) => ({ ...prev, [key]: null }));
        });
    }
    return () => {
      vigente = false;
    };
    // activos es estático (sale de la configuración)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return series;
}
