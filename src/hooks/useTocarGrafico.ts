import { useEffect, useRef, useState } from "react";

/**
 * Tocar (o pasar el mouse sobre) el gráfico grande para leer el valor exacto
 * de un punto, como en las apps de inversión. Mientras se toca, el dedo fija
 * qué punto mostrar; al soltar (o sacar el mouse), vuelve a verse el gráfico
 * solo, sin ningún punto marcado.
 *
 * Usa listeners nativos (no los sintéticos de React) por el mismo motivo que
 * useSwipeToClose: hace falta frenar con preventDefault el deslizamiento que
 * cierra la tarjeta (y el scroll) mientras se arrastra el dedo sobre el
 * gráfico, y React registra touchmove como pasivo. Un efecto colateral útil:
 * al ser nativos y vivir en el propio gráfico (más adentro que la tarjeta),
 * frenan ahí mismo la propagación, así que ese gesto de cerrar nunca llega a
 * enterarse del toque.
 */
export function useTocarGrafico(cantidadPuntos: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [indice, setIndice] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || cantidadPuntos < 2) return;

    const indiceDesdeX = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return 0;
      const proporcion = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return Math.round(proporcion * (cantidadPuntos - 1));
    };

    function onTouchStart(e: TouchEvent) {
      e.stopPropagation();
      setIndice(indiceDesdeX(e.touches[0].clientX));
    }
    function onTouchMove(e: TouchEvent) {
      e.stopPropagation();
      e.preventDefault();
      setIndice(indiceDesdeX(e.touches[0].clientX));
    }
    function onTouchEnd(e: TouchEvent) {
      e.stopPropagation();
      setIndice(null);
    }
    function onMouseMove(e: MouseEvent) {
      setIndice(indiceDesdeX(e.clientX));
    }
    function onMouseLeave() {
      setIndice(null);
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
      setIndice(null);
    };
  }, [cantidadPuntos]);

  return { ref, indice };
}
