import type { ResourceStatus } from "../hooks/useResource";

/**
 * true si alguno de los recursos quedó en "stale" (se muestra la última copia
 * guardada porque la fuente falló) o "error" (no hay ni copia guardada). Se
 * usa para que el encabezado deje de afirmar "cotizaciones en vivo" apenas
 * algo no está al día: nunca se presenta un dato viejo como si fuera actual.
 */
export function hayAlgunDatoDesactualizado(estados: ResourceStatus[]): boolean {
  return estados.some((s) => s === "stale" || s === "error");
}
