import { useEffect, useRef, useState } from "react";

// Cuánto hay que arrastrar para que el gesto se confirme. Menos de esto vuelve
// solo: un temblor del dedo no debe fijar ni desfijar una tarjeta.
export const UMBRAL_ACCION_PX = 96;
// Antes de este movimiento no decidimos si es un deslizamiento o un scroll.
const UMBRAL_GESTO_PX = 10;

/** Decide si un arrastre soltado en `dx` px confirma la acción. Pura, para probarla. */
export function confirmaAccion(dx: number): boolean {
  return dx >= UMBRAL_ACCION_PX;
}

/**
 * Deslizar una tarjeta de izquierda a derecha para ejecutar una acción (fijar),
 * como en Spotify: la tarjeta se corre y, detrás, aparece el indicador. Si se
 * suelta pasado el umbral, la acción se ejecuta; si no, vuelve sola.
 *
 * Solo reacciona a gestos horizontales. Un gesto vertical se deja al scroll
 * normal de la página: el CSS declara touch-action: pan-y en la tarjeta, así
 * el navegador scrollea sin esperar a este código y los listeners son pasivos.
 */
export function useSwipeAccion(activo: boolean, onAccion: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [arrastreX, setArrastreX] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);

  const onAccionRef = useRef(onAccion);
  useEffect(() => {
    onAccionRef.current = onAccion;
  });

  useEffect(() => {
    const el = ref.current;
    if (!activo || !el) return;

    let inicio: { x: number; y: number } | null = null;
    let horizontal = false;

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      inicio = { x: t.clientX, y: t.clientY };
      horizontal = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (!inicio) return;
      const t = e.touches[0];
      const dx = t.clientX - inicio.x;
      const dy = t.clientY - inicio.y;

      if (!horizontal) {
        if (Math.abs(dx) < UMBRAL_GESTO_PX && Math.abs(dy) < UMBRAL_GESTO_PX) return;
        if (Math.abs(dy) >= Math.abs(dx) || dx < 0) {
          // Vertical (scroll de la grilla) o hacia la izquierda: no es nuestro gesto.
          inicio = null;
          return;
        }
        horizontal = true;
        setArrastrando(true);
      }

      // Se corre con resistencia: cuesta más cuanto más se aleja del origen.
      setArrastreX(dx > UMBRAL_ACCION_PX ? UMBRAL_ACCION_PX + (dx - UMBRAL_ACCION_PX) * 0.3 : dx);
    }

    function onTouchEnd(e: TouchEvent) {
      if (horizontal) {
        const dx = e.changedTouches[0] ? e.changedTouches[0].clientX - (inicio?.x ?? 0) : 0;
        if (confirmaAccion(dx)) {
          // Vibración corta: confirma el gesto sin mirar la pantalla.
          navigator.vibrate?.(12);
          onAccionRef.current();
        }
      }
      inicio = null;
      horizontal = false;
      setArrastrando(false);
      setArrastreX(0);
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      setArrastreX(0);
      setArrastrando(false);
    };
  }, [activo]);

  return { ref, arrastreX, arrastrando };
}
