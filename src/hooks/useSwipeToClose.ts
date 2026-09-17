import { useEffect, useRef, useState } from "react";

// Por debajo de esto, un gesto se cierra solo (rebota); dejarlo bajo hace que
// cualquier temblor del dedo cierre la tarjeta sin querer.
const UMBRAL_CIERRE_PX = 110;
// Hasta que el dedo no se movió esto, no decidimos si es un arrastre
// horizontal o un scroll vertical de la página.
const UMBRAL_GESTO_PX = 10;

/**
 * Cerrar deslizando de izquierda a derecha, además de la X, el fondo y
 * Escape. Solo actúa mientras `activo` (la tarjeta expandida): en la grilla
 * colapsada el mismo gesto tiene que seguir siendo scroll vertical normal de
 * la página, nunca algo que esto intercepte.
 *
 * Usa listeners nativos (no los `onTouchMove` sintéticos de React) porque
 * React los registra como pasivos desde la v17 por rendimiento de scroll: un
 * `preventDefault()` adentro de un `onTouchMove` de React no hace nada (y
 * tira un warning). Frenar el scroll de la página mientras se arrastra la
 * tarjeta necesita un listener no pasivo de verdad.
 */
export function useSwipeToClose(activo: boolean, onClose: () => void) {
  const ref = useRef<HTMLElement | null>(null);
  const [arrastreX, setArrastreX] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);

  // Evita que el efecto de abajo tenga que re-suscribirse cada vez que
  // `onClose` cambia de identidad entre renders. Se actualiza en su propio
  // efecto, no durante el render: mutar un ref mientras se renderiza puede
  // pisar un valor que un render descartado todavía necesitaba.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
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
        if (Math.abs(dy) >= Math.abs(dx)) {
          // Gesto vertical (scrollear el histórico expandido, por ejemplo):
          // dejamos de mirarlo, que el navegador lo trate como scroll normal.
          inicio = null;
          return;
        }
        horizontal = true;
        setArrastrando(true);
      }

      // Solo izquierda→derecha cierra; hacia la izquierda no pasa nada, sin
      // rebote raro en el sentido contrario.
      const dxClamped = Math.max(dx, 0);
      e.preventDefault();
      setArrastreX(dxClamped);
    }

    function onTouchEnd() {
      if (horizontal) {
        setArrastreX((actual) => {
          if (actual > UMBRAL_CIERRE_PX) onCloseRef.current();
          return 0;
        });
      }
      inicio = null;
      horizontal = false;
      setArrastrando(false);
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      // Si se cierra por otro medio (la X, el fondo, Escape) a mitad de un
      // arrastre, no debe quedar ningún corrimiento pisado para la próxima
      // vez que se abra esta tarjeta.
      setArrastreX(0);
      setArrastrando(false);
    };
  }, [activo]);

  return { ref, arrastreX, arrastrando };
}
