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
}
