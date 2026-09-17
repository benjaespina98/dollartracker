// Lógica pura de favoritos, separada del hook (que solo la conecta a
// useState/localStorage) para poder probarla sin renderizar nada — mismo
// enfoque que recortarRango en useHistorico.

export const FAVORITOS_STORAGE_KEY = "dollartracker-favoritos";

export function leerFavoritos(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function guardarFavoritos(favoritos: string[]): void {
  try {
    localStorage.setItem(FAVORITOS_STORAGE_KEY, JSON.stringify(favoritos));
  } catch {
    // localStorage bloqueado (modo privado, cuota llena): la app sigue
    // funcionando, solo no se recuerda la elección entre visitas.
  }
}

/** Se agrega al final (así lo último marcado no se cuela antes que lo demás) o se saca, según ya esté. */
export function alternarFavorito(favoritos: string[], key: string): string[] {
  return favoritos.includes(key) ? favoritos.filter((k) => k !== key) : [...favoritos, key];
}

/** Intercambia `key` con su vecino en esa dirección; no hace nada si ya está en la punta. */
export function moverFavorito(favoritos: string[], key: string, direccion: -1 | 1): string[] {
  const i = favoritos.indexOf(key);
  const j = i + direccion;
  if (i === -1 || j < 0 || j >= favoritos.length) return favoritos;
  const copia = [...favoritos];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return copia;
}
