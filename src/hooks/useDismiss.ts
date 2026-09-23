import { useEffect, useRef, type RefObject } from "react";

/**
 * Cierra un panel desplegado (los "(i)" de la app y de las tarjetas) al tocar
 * o hacer clic fuera de `ref`, o con Escape. Antes esos paneles solo se
 * cerraban volviendo a tocar el mismo botón, sin ninguna otra salida.
 */
export function useDismiss(activo: boolean, ref: RefObject<HTMLElement | null>, onDismiss: () => void) {
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!activo) return;

    function onPointerDown(e: PointerEvent) {
      const el = ref.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) onDismissRef.current();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDismissRef.current();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activo, ref]);
}
