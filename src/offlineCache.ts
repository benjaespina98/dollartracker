// Guarda el último dato que sí se pudo traer, para poder mostrarlo cuando
// falla el fetch (sin conexión, la fuente está caída, etc.) en vez de dejar
// la tarjeta en un estado de error sin ninguna información.
const PREFIX = "dollartracker:cache:";

export function saveToCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — no es crítico
  }
}

export function loadFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; savedAt: number };
    return parsed.data;
  } catch {
    return null;
  }
}
