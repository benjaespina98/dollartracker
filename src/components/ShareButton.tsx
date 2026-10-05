import { mostrarToast } from "../lib/toast";
import { IconCopy, IconShare } from "./icons";

interface Props {
  /** Línea ya armada que se comparte o se copia */
  texto: string;
  label: string;
}

// Con menú nativo de compartir (celulares) muestra el ícono de compartir; sin
// él (escritorio) copia al portapapeles, y el ícono lo dice: dos cuadrados en
// vez de la flecha. En los dos casos el resultado se avisa con un toast, porque
// antes copiar no daba ninguna señal más que un tilde de un segundo.
export default function ShareButton({ texto, label }: Props) {
  const nativo = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function compartir() {
    if (nativo) {
      try {
        await navigator.share({ title: "DollarTracker", text: texto, url: window.location.href });
        return;
      } catch (e) {
        // Cancelar el menú nativo no es un error: no hay que copiar a escondidas.
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast("Copiado al portapapeles");
    } catch {
      mostrarToast("No se pudo copiar");
    }
  }

  return (
    <button
      className="shareBtn"
      onClick={compartir}
      type="button"
      aria-label={label}
      title={nativo ? "Compartir" : "Copiar cotización"}
    >
      {nativo ? <IconShare width={15} height={15} /> : <IconCopy width={15} height={15} />}
    </button>
  );
}
