import { useSyncExternalStore } from "react";

// Mismo corte que el CSS de celular (max-width: 560px).
const CONSULTA = "(max-width: 560px)";

const hayMatchMedia = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

function suscribirse(avisar: () => void): () => void {
  if (!hayMatchMedia()) return () => {};
  const lista = window.matchMedia(CONSULTA);
  lista.addEventListener("change", avisar);
  return () => lista.removeEventListener("change", avisar);
}

/**
 * true en pantallas de celular. Se usa para elegir entre dos estructuras de
 * tarjeta (fila compacta o tarjeta completa), algo que el CSS solo no puede
 * hacer. Del lado del servidor, y en los tests de render estático, es false.
 */
export function useEsMovil(): boolean {
  return useSyncExternalStore(
    suscribirse,
    () => (hayMatchMedia() ? window.matchMedia(CONSULTA).matches : false),
    () => false
  );
}
