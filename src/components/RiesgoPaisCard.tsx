import { useState, type CSSProperties } from "react";
import type { RiesgoPais } from "../types";

interface Props {
  accent: string;
  data: RiesgoPais | null;
  previousValor: number | null;
  status: "loading" | "ready" | "error";
}

const valueFormatter = new Intl.NumberFormat("es-AR");

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
});

export default function RiesgoPaisCard({ accent, data, previousValor, status }: Props) {
  const [copied, setCopied] = useState(false);

  const diff = data && previousValor !== null ? data.valor - previousValor : null;

  async function handleShare() {
    if (!data) return;
    const text = `Riesgo País: ${valueFormatter.format(data.valor)} puntos básicos — DollarTracker`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "DollarTracker", text, url: window.location.href });
        return;
      } catch {
        // el usuario canceló el share nativo; probamos con el portapapeles
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // portapapeles no disponible; no hacemos nada más
    }
  }

  return (
    <section className="quoteCard" style={{ "--accent": accent } as CSSProperties}>
      <header className="quoteHeader">
        <h2 className="quoteTitle">Riesgo País</h2>
        {data && (
          <button
            className={`shareBtn ${copied ? "shareBtn--copied" : ""}`}
            onClick={handleShare}
            type="button"
            aria-label="Compartir riesgo país"
            title={copied ? "¡Copiado!" : "Compartir / copiar"}
          >
            {copied ? (
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
        )}
      </header>

      <div className={`quoteBody quoteBody--${status}`}>
        {status === "loading" && !data && (
          <div className="skeleton" aria-label="Cargando riesgo país">
            <span className="skeletonBlock" />
          </div>
        )}
        {status === "error" && !data && <span className="quoteError">⚠ No se pudo obtener el dato</span>}

        {data && (
          <>
            <div className="marketPrice">
              <span className="marketPrice__value">{valueFormatter.format(data.valor)}</span>
              <span className="marketPrice__unit">puntos básicos</span>
            </div>

            <div className="quoteMeta">
              {diff !== null && diff !== 0 && (
                <span className={`quoteVariation ${diff > 0 ? "up" : "down"}`}>
                  {diff > 0 ? "▲" : "▼"} {Math.abs(diff)} pb
                </span>
              )}
              <span className="quoteUpdated" title={`Último dato informado: ${data.fecha}`}>
                Cierre del {dateFormatter.format(new Date(`${data.fecha}T12:00:00`))}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
