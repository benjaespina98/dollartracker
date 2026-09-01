import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromCache } from "../lib/offlineCache";
import type { Cotizacion } from "../types";
import { fetchResource, type ResourceEntry, type ResourceStatus } from "./useResource";

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

export type CotizacionStatus = ResourceStatus;
export type CotizacionesState = Record<string, ResourceEntry<Cotizacion>>;

function estadoInicial(): CotizacionesState {
  return Object.fromEntries(
    Object.keys(ENDPOINTS).map((key) => {
      const cached = loadFromCache<Cotizacion>(key);
      return [key, { data: cached?.data ?? null, status: "loading" as const, savedAt: cached?.savedAt ?? null }];
    })
  );
}

async function pedirCotizacion(url: string, signal: AbortSignal): Promise<Cotizacion> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useCotizaciones() {
  const [state, setState] = useState<CotizacionesState>(estadoInicial);
  // Un solo AbortController para la tanda completa: si se dispara un refresh
  // nuevo con la tanda anterior todavía en vuelo, cancela los ocho pedidos de
  // una y evita que una respuesta vieja pise un dato más fresco.
  const controladorRef = useRef<AbortController | null>(null);

  const fetchAll = useCallback(async () => {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;

    setState((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(ENDPOINTS)) next[key] = { ...next[key], status: "loading" };
      return next;
    });

    await Promise.all(
      Object.entries(ENDPOINTS).map(async ([key, url]) => {
        const entry = await fetchResource<Cotizacion>(
          key,
          (signal) => pedirCotizacion(url, signal),
          controlador.signal
        );
        if (controlador.signal.aborted) return;
        setState((prev) => ({ ...prev, [key]: entry }));
      })
    );
  }, []);

  useEffect(() => {
    // Falso positivo de react-hooks/set-state-in-effect: fetchAll toca el ref
    // del AbortController antes de actualizar el estado, que es el patrón de
    // cancelación que documenta React (ver el mismo comentario en useResource).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      controladorRef.current?.abort();
    };
  }, [fetchAll]);

  return { state, refresh: fetchAll };
}
