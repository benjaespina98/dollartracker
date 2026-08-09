import { useState, type CSSProperties } from "react";
import type { Cotizacion } from "../types";

interface Props {
  label: string;
  accent: string;
  data: Cotizacion | null;
  previousVenta: number | null;
  status: "loading" | "ready" | "error";
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const fullDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export default function QuoteCard({ label, accent, data, previousVenta, status }: Props) {
  const [copied, setCopied] = useState(false);

  const variation =
    data && previousVenta !== null && previousVenta !== 0
      ? ((data.venta - previousVenta) / previousVenta) * 100
      : null;

  async function handleShare() {
    if (!data) return;
    const text = `${label}: compra ${currencyFormatter.format(data.compra)} · venta ${currencyFormatter.format(
      data.venta
    )} — DollarTracker`;

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
        <h2 className="quoteTitle">{label}</h2>
        {data && (
          <button
            className={`shareBtn ${copied ? "shareBtn--copied" : ""}`}
            onClick={handleShare}
            type="button"
            aria-label={`Compartir cotización de ${label}`}
            title={copied ? "¡Copiado!" : "Compartir / copiar"}
          >
            {copied ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 6 9 17l-5-5"
                />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="9" y="9" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M15 5H5.5A2.5 2.5 0 0 0 3 7.5V19"
                />
              </svg>
            )}
          </button>
        )}
      </header>

      <div className={`quoteBody quoteBody--${status}`}>
        {status === "loading" && !data && (
          <div className="skeleton" aria-label="Cargando cotización">
            <span className="skeletonBlock" />
            <span className="skeletonBlock" />
          </div>
        )}
        {status === "error" && !data && (
          <span className="quoteError">⚠ No se pudo obtener el dato</span>
        )}

        {data && (
          <>
            <div className="quotePrices">
              <div className="quotePriceBlock">
                <span className="quotePriceLabel">Compra</span>
                <span className="quotePriceValue">{currencyFormatter.format(data.compra)}</span>
              </div>
              <div className="quotePriceBlock quotePriceBlock--venta">
                <span className="quotePriceLabel">Venta</span>
                <span className="quotePriceValue quotePriceValue--accent">{currencyFormatter.format(data.venta)}</span>
              </div>
            </div>

            <div className="quoteMeta">
              {variation !== null && Math.abs(variation) > 0.001 && (
                <span className={`quoteVariation ${variation > 0 ? "up" : "down"}`}>
                  {variation > 0 ? "▲" : "▼"} {Math.abs(variation).toFixed(2)}%
                </span>
              )}
              <span
                className="quoteUpdated"
                title={`La fuente (DolarAPI) informó este valor el ${fullDateFormatter.format(
                  new Date(data.fechaActualizacion)
                )} hs. No todas las cotizaciones se actualizan a la misma frecuencia.`}
              >
                Act. {timeFormatter.format(new Date(data.fechaActualizacion))} hs
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
