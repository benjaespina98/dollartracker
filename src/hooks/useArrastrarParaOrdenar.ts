import { useEffect, useRef, useState } from "react";

// Mantener apretado este tiempo activa el modo "mover": así un deslizamiento
// normal sigue siendo scroll de la página.
export const ESPERA_ARRASTRE_MS = 350;
const TOLERANCIA_PX = 10;

/**
 * Cuántos lugares cruzó el dedo: `desplazamiento` en px y `paso` = alto de una
 * tarjeta con su separación. Pura, para probarla sin tocar nada.
 */
export function pasosCruzados(desplazamiento: number, paso: number): number {
  if (paso <= 0) return 0;
  return Math.trunc(desplazamiento / paso) || 0;
}

/**
 * Reordenar una tarjeta de la lista de Fijados manteniéndola apretada y
 * arrastrándola arriba o abajo. Cada vez que el dedo cruza una tarjeta vecina,
 * se intercambian (onMover). La tarjeta sigue al dedo mientras cambia de lugar.
 */
export function useArrastrarParaOrdenar(activo: boolean, onMover: (direccion: -1 | 1) => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);

  const onMoverRef = useRef(onMover);
  useEffect(() => {
    onMoverRef.current = onMover;
  });

  useEffect(() => {
    const el = ref.current;
    if (!activo || !el) return;

    let inicio: { x: number; y: number } | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let modoMover = false;
    let huboArrastre = false;
    // Cuánto se movió ya la tarjeta en la lista. El dedo sigue, pero la tarjeta
    // ya cambió de lugar, así que se descuenta para que no salte.
    let movidoEnLista = 0;

    // Distancia a la tarjeta vecina en la dirección indicada, o 0 si no hay.
    function paso(direccion: -1 | 1): number {
      const vecino = (direccion === 1 ? el!.nextElementSibling : el!.previousElementSibling) as HTMLElement | null;
      if (!vecino) return 0;
      return Math.abs(vecino.getBoundingClientRect().top - el!.getBoundingClientRect().top);
    }

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      inicio = { x: t.clientX, y: t.clientY };
      modoMover = false;
      huboArrastre = false;
      movidoEnLista = 0;
      clearTimeout(timer);
      timer = setTimeout(() => {
        modoMover = true;
        setArrastrando(true);
        navigator.vibrate?.(12);
      }, ESPERA_ARRASTRE_MS);
    }

    function onTouchMove(e: TouchEvent) {
      if (!inicio) return;
      const t = e.touches[0];
      const dy = t.clientY - inicio.y;
      const dx = t.clientX - inicio.x;

      if (!modoMover) {
        // Se movió antes de la espera: es un scroll, no un reordenamiento.
        if (Math.abs(dy) > TOLERANCIA_PX || Math.abs(dx) > TOLERANCIA_PX) {
          clearTimeout(timer);
          inicio = null;
        }
        return;
      }

      e.preventDefault();
      huboArrastre = true;

      const restante = dy - movidoEnLista;
      const direccion: -1 | 1 = restante > 0 ? 1 : -1;
      const distancia = paso(direccion);
      if (distancia > 0 && Math.abs(restante) >= distancia / 2) {
        onMoverRef.current(direccion);
        movidoEnLista += direccion * distancia;
      }
      setDesplazamiento(dy - movidoEnLista);
    }

    function onTouchEnd() {
      clearTimeout(timer);
      inicio = null;
      modoMover = false;
      setArrastrando(false);
      setDesplazamiento(0);
    }

    // Tras arrastrar, el click del soltado no debe abrir la tarjeta.
    function onClick(e: MouseEvent) {
      if (huboArrastre) {
        e.stopPropagation();
        e.preventDefault();
        huboArrastre = false;
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("click", onClick, { capture: true });

    return () => {
      clearTimeout(timer);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("click", onClick, { capture: true });
      setDesplazamiento(0);
      setArrastrando(false);
    };
  }, [activo]);

  return { ref, desplazamiento, arrastrando };
}
