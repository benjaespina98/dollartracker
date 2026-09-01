import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromCache, saveToCache } from "../lib/offlineCache";

export type ResourceStatus = "loading" | "ready" | "stale" | "error";

export interface ResourceEntry<T> {
  data: T | null;
  status: ResourceStatus;
  /** Date.now() del dato que se está mostrando (recién llegado o del cache), null si nunca hubo nada guardado */
  savedAt: number | null;
}

/** Sin esto, un usuario que abre la app ya sin señal esperaba el timeout de cada fetch para recién ahí caer al cache. */
export function estaOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Pide un recurso y lo resuelve contra el cache de `localStorage`: es la
 * lógica que antes estaba duplicada casi al calco entre useCotizaciones y
 * useMarketData (fetch → guardar → "ready", o fallar → cache → "stale"/"error").
 *
 * No es un hook — así lo puede usar tanto `useResource` (un solo recurso) como
 * un `Promise.all` de varios en paralelo (un diccionario de recursos, como las
 * ocho casas del dólar o los símbolos de mercado), que no pueden llamar a un
 * hook una cantidad dinámica de veces.
 */
export async function fetchResource<T>(
  cacheKey: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal
): Promise<ResourceEntry<T>> {
  if (estaOffline()) {
    const cached = loadFromCache<T>(cacheKey);
    return cached
      ? { data: cached.data, status: "stale", savedAt: cached.savedAt }
      : { data: null, status: "error", savedAt: null };
  }

  try {
    const data = await fetcher(signal);
    const savedAt = saveToCache(cacheKey, data);
    return { data, status: "ready", savedAt };
  } catch {
    // Cubre tanto un fallo real (red caída, HTTP 5xx) como un abort a
    // propósito: si se abortó, quien llamó a fetchResource va a descartar
    // este resultado igual (ver `signal.aborted` en el caller), así que no
    // hace falta distinguir el motivo acá.
    const cached = loadFromCache<T>(cacheKey);
    return cached
      ? { data: cached.data, status: "stale", savedAt: cached.savedAt }
      : { data: null, status: "error", savedAt: null };
  }
}

interface UseResourceOptions<T> {
  /** Clave del cache; también identifica al recurso entre refrescos */
  cacheKey: string;
  fetcher: (signal: AbortSignal) => Promise<T>;
  intervalMs: number;
}

/**
 * Hook para UN recurso remoto con cache y refresco periódico (riesgo país,
 * por ejemplo). Cancela el pedido en vuelo con `AbortController` si se
 * dispara un refresh nuevo antes de que termine el anterior —el caso típico
 * es un refresh manual justo cuando el intervalo automático también disparó—
 * para que la respuesta más vieja no le gane la carrera al setState y pise un
 * dato más fresco.
 */
export function useResource<T>({ cacheKey, fetcher, intervalMs }: UseResourceOptions<T>) {
  const [entry, setEntry] = useState<ResourceEntry<T>>(() => {
    const cached = loadFromCache<T>(cacheKey);
    return { data: cached?.data ?? null, status: "loading", savedAt: cached?.savedAt ?? null };
  });

  const controladorRef = useRef<AbortController | null>(null);
  // La identidad del fetcher puede cambiar en cada render (suele venir de una
  // arrow function inline); guardarlo en un ref evita que `refresh` tenga que
  // recrearse -y con eso, reiniciar el intervalo- cada vez. Se actualiza en un
  // efecto, no durante el render: mutar un ref mientras se renderiza puede
  // pisar un valor que un render descartado (StrictMode, Suspense) todavía
  // necesitaba.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const refresh = useCallback(async () => {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;

    setEntry((prev) => ({ ...prev, status: "loading" }));

    const resultado = await fetchResource(cacheKey, fetcherRef.current, controlador.signal);
    if (controlador.signal.aborted) return; // un refresh más nuevo ya está en curso
    setEntry(resultado);
  }, [cacheKey]);

  useEffect(() => {
    // La regla react-hooks/set-state-in-effect marca esto porque `refresh`
    // toca un ref (el AbortController) antes de actualizar el estado: es
    // exactamente el patrón de cancelación de fetches que recomienda la propia
    // documentación de React ("Synchronizing with Effects"), así que el falso
    // positivo se descarta acá en vez de sacar el AbortController.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => {
      clearInterval(interval);
      controladorRef.current?.abort();
    };
  }, [refresh, intervalMs]);

  return { ...entry, refresh };
}
