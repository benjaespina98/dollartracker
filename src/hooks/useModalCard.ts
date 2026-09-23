import { useEffect } from "react";

// Solo una tarjeta puede estar expandida a la vez: el backdrop cubre toda la
// pantalla y bloquea los clics sobre el resto de la grilla. Por eso es seguro
// que este hook toque document.body directamente sin pisar a otra instancia.
export function useModalCard(expandida: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!expandida) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandida, onClose]);

  // Atrás (el gesto o botón del celular, o el del navegador) cierra el
  // detalle en vez de sacar de la app: abrir el popup agrega una entrada al
  // historial y volver la consume. Si se cierra por otro medio (X, fuera del
  // popup, deslizar), esa entrada se retira para que "atrás" no quede gastado
  // en un paso que no hace nada visible.
  useEffect(() => {
    if (!expandida) return;

    history.pushState({ dtTarjeta: true }, "");
    let cerradoPorAtras = false;

    function onPopState() {
      cerradoPorAtras = true;
      onClose();
    }
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      if (!cerradoPorAtras && history.state?.dtTarjeta) history.back();
    };
  }, [expandida, onClose]);
}
