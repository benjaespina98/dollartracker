import type { Cotizacion, MarketQuote, RiesgoPais } from "../types";

const TIMEOUT_MS = 8000;
const REINTENTOS = 2;
const ESPERA_BASE_MS = 500;

export class ErrorHttp extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

function esperar(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        resolve();
      },
      { once: true }
    );
  });
}

// Un 4xx no se arregla reintentando (salvo 429): solo se repite ante caídas de
// red, timeouts y errores 5xx.
function esReintentable(error: unknown): boolean {
  return !(error instanceof ErrorHttp) || error.status >= 500 || error.status === 429;
}

/**
 * GET de un JSON con timeout por intento y reintentos con backoff exponencial.
 * `validar` rechaza respuestas con forma inesperada (un proveedor que cambia el
 * formato no debe llegar a la interfaz como `undefined`).
 */
export async function pedirJson<T>(
  url: string,
  signal: AbortSignal,
  validar: (datos: unknown) => datos is T,
  { reintentos = REINTENTOS, esperaBaseMs = ESPERA_BASE_MS }: { reintentos?: number; esperaBaseMs?: number } = {}
): Promise<T> {
  for (let intento = 0; ; intento++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) });
      if (!res.ok) throw new ErrorHttp(res.status);
      const datos: unknown = await res.json();
      if (!validar(datos)) throw new Error("respuesta con formato inesperado");
      return datos;
    } catch (error) {
      if (signal.aborted || intento >= reintentos || !esReintentable(error)) throw error;
      await esperar(esperaBaseMs * 2 ** intento, signal);
      if (signal.aborted) throw error;
    }
  }
}

function esObjeto(datos: unknown): datos is Record<string, unknown> {
  return datos !== null && typeof datos === "object" && !Array.isArray(datos);
}

export function esCotizacion(datos: unknown): datos is Cotizacion {
  return (
    esObjeto(datos) &&
    typeof datos.compra === "number" &&
    typeof datos.venta === "number" &&
    typeof datos.fechaActualizacion === "string" &&
    typeof datos.nombre === "string" &&
    typeof datos.moneda === "string"
  );
}

export function esRiesgoPais(datos: unknown): datos is RiesgoPais {
  return esObjeto(datos) && typeof datos.valor === "number" && typeof datos.fecha === "string";
}

export function esPayloadMercado(datos: unknown): datos is Record<string, MarketQuote | null> {
  return esObjeto(datos);
}
