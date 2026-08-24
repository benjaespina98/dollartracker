import { useEffect, useRef, useState } from "react";

interface Props {
  /** Línea ya armada que se comparte o se copia */
  texto: string;
  label: string;
}

// Compartir/copiar era el mismo bloque de 40 líneas repetido en las tres
// tarjetas, cada una con su propio estado `copied` y su propio timeout sin
// limpiar (que avisaba de un setState sobre un componente desmontado si se
// cerraba la tarjeta justo después de copiar).
export default function ShareButton({ texto, label }: Props) {
  const [copiado, setCopiado] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeout.current), []);

  async function compartir() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "DollarTracker", text: texto, url: window.location.href });
        return;
      } catch {
        // el usuario canceló el share nativo; probamos con el portapapeles
      }
    }

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopiado(false), 1600);
    } catch {
      // portapapeles no disponible; no hacemos nada más
    }
  }

  return (
    <button
      className={`shareBtn ${copiado ? "shareBtn--copied" : ""}`}
      onClick={compartir}
      type="button"
      aria-label={label}
      title={copiado ? "¡Copiado!" : "Compartir"}
    >
      {copiado ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="9" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M15 5H5.5A2.5 2.5 0 0 0 3 7.5V19" />
        </svg>
      )}
    </button>
  );
}
