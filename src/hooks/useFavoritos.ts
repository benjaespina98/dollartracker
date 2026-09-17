import { useCallback, useEffect, useState } from "react";
import { alternarFavorito, guardarFavoritos, leerFavoritos, moverFavorito } from "../lib/favoritos";

/**
 * Favoritos + su orden, con persistencia en localStorage. La clave de cada
 * tarjeta es la misma que ya la identifica en el resto de la app: `casa`
 * (dólar/euro/real), la `key` de mercados/granos, o el literal "riesgoPais".
 * El orden del array ES el orden que elige la persona (más arriba = primero
 * en la sección de Favoritos), no solo el conjunto de qué está marcado.
 */
export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<string[]>(leerFavoritos);

  useEffect(() => {
    guardarFavoritos(favoritos);
  }, [favoritos]);

  const esFavorito = useCallback((key: string) => favoritos.includes(key), [favoritos]);

  const toggleFavorito = useCallback((key: string) => {
    setFavoritos((actual) => alternarFavorito(actual, key));
  }, []);

  const mover = useCallback((key: string, direccion: -1 | 1) => {
    setFavoritos((actual) => moverFavorito(actual, key, direccion));
  }, []);

  return { favoritos, esFavorito, toggleFavorito, mover };
}
