import { pedirJson } from "../lib/http";
import { fetchResource, type ResourceEntry } from "./useResource";
import { useEffect, useRef, useState } from "react";

const CRIPTOYA_DOLAR = "https://criptoya.com/api/dolar";

interface RespuestaCriptoYa {
  mayorista: { price: number };
}

function esRespuestaCriptoYa(datos: unknown): datos is RespuestaCriptoYa {
  if (datos === null || typeof datos !== "object") return false;
  const m = (datos as Record<string, unknown>).mayorista as Record<string, unknown> | undefined;
  return !!m && typeof m.price === "number" && Number.isFinite(m.price);
}

/**
 * Dólar mayorista: la cotización de referencia del mercado mayorista, la que
 * usa como base el tipo de cambio oficial. Viene de CriptoYa (que la publica
 * por separado de DolarAPI). Se refresca cada 5 minutos y cae al último valor
 * guardado si falla, como el resto.
 */
export function useMayorista() {
  const [entry, setEntry] = useState<ResourceEntry<number>>({ data: null, status: "loading", savedAt: null });
  const controladorRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const refresh = async () => {
      controladorRef.current?.abort();
      const controlador = new AbortController();
      controladorRef.current = controlador;
      const resultado = await fetchResource<number>(
        "mayorista",
        async (signal) => (await pedirJson(CRIPTOYA_DOLAR, signal, esRespuestaCriptoYa)).mayorista.price,
        controlador.signal
      );
      if (!controlador.signal.aborted) setEntry(resultado);
    };
    refresh();
    const interval = setInterval(refresh, 5 * 60_000);
    return () => {
      clearInterval(interval);
      controladorRef.current?.abort();
    };
  }, []);

  return entry;
}
