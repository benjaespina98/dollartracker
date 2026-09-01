// Guarda el último dato que sí se pudo traer, para poder mostrarlo cuando
// falla el fetch (sin conexión, la fuente está caída, etc.) en vez de dejar
// la tarjeta en un estado de error sin ninguna información.
const PREFIX = "dollartracker:cache:";

export interface CacheRecord<T> {
  data: T;
  /** Date.now() de cuando se guardó, para poder mostrar "actualizado hace X min" */
  savedAt: number;
}

/** Devuelve el `savedAt` guardado, así el que llama puede mostrar "hace X min" sin volver a leer el cache. */
export function saveToCache<T>(key: string, data: T): number {
  const savedAt = Date.now();
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, savedAt }));
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — no es crítico
  }
  return savedAt;
}

export function loadFromCache<T>(key: string): CacheRecord<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheRecord<T>;
  } catch {
    return null;
  }
}
