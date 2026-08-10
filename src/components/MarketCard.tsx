import { useState, type CSSProperties, type ReactNode } from "react";
import { recortarRango, type RangoDias, type SeriePunto } from "../useHistorico";
import type { MarketQuote } from "../types";
import HistoricoPanel from "./HistoricoPanel";
import SparklineRow from "./SparklineRow";

interface Props {
  label: string;
  icon: ReactNode;
  unit: string;
  accent: string;
  data: MarketQuote | null;
  status: "loading" | "ready" | "stale" | "error";
  /** Serie diaria del símbolo, null mientras carga o si falló */
  historico: SeriePunto[] | null;
}

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
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

export default function MarketCard({ label, icon, unit, accent, data, status, historico }: Props) {
  const [copied, setCopied] = useState(false);
  const [expandida, setExpandida] = useState(false);
  const [rango, setRango] = useState<RangoDias>(30);
  const marketDate = data?.marketTime ? new Date(data.marketTime * 1000) : null;

  // Sin datos no hay nada que desplegar: la tarjeta no debe parecer clickeable
  const puedeExpandirse = !!data && (historico?.length ?? 0) >= 2;
  const serieMini = historico ? recortarRango(historico, 30) : null;

  async function handleShare() {
    if (!data) return;
    const changeText =
      data.changePercent !== null ? ` (${data.changePercent > 0 ? "+" : ""}${data.changePercent.toFixed(2)}%)` : "";
    const text = `${label}: ${priceFormatter.format(data.price)}${changeText} — DollarTracker`;

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
    <section
      className={`quoteCard ${expandida ? "quoteCard--expandida" : ""}`}
      style={{ "--accent": accent } as CSSProperties}
    >
      <header className="quoteHeader">
        <div className="quoteTitleGroup">
          <span className="quoteIcon">{icon}</span>
          <h2 className="quoteTitle">{label}</h2>
        </div>
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

      {/* El botón de compartir vive en el header, fuera de este div, así que
          podemos hacer clickeable todo el cuerpo sin anidar controles. */}
      <div
        className={`quoteBody quoteBody--${status} ${puedeExpandirse ? "quoteBody--expandible" : ""}`}
        onClick={puedeExpandirse ? () => setExpandida((v) => !v) : undefined}
        onKeyDown={
          puedeExpandirse
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandida((v) => !v);
                }
              }
            : undefined
        }
        role={puedeExpandirse ? "button" : undefined}
        tabIndex={puedeExpandirse ? 0 : undefined}
        aria-expanded={puedeExpandirse ? expandida : undefined}
        aria-label={puedeExpandirse ? `${label}: ver histórico` : undefined}
      >
        {status === "loading" && !data && (
          <div className="skeleton" aria-label="Cargando cotización">
            <span className="skeletonBlock" />
          </div>
        )}
        {status === "error" && !data && <span className="quoteError">⚠ No se pudo obtener el dato</span>}

        {data && (
          <>
            <div className="marketPrice">
              <span className="marketPrice__value">{priceFormatter.format(data.price)}</span>
              <span className="marketPrice__unit">{unit}</span>
            </div>

            {/* Hueco reservado para que la tarjeta no salte cuando llega la serie */}
            <SparklineRow
              valores={serieMini?.map((p) => p.valor) ?? null}
              expandida={expandida}
              expandible={puedeExpandirse}
            />

            <div className="quoteMeta">
              {status === "stale" && (
                <span className="offlineTag" title="No se pudo actualizar; este es el último valor guardado en este dispositivo">
                  ⚠ Sin conexión
                </span>
              )}
              {status !== "stale" && data.changePercent !== null && Math.abs(data.changePercent) > 0.001 && (
                <span className={`quoteVariation ${data.changePercent > 0 ? "up" : "down"}`}>
                  {data.changePercent > 0 ? "▲" : "▼"} {Math.abs(data.changePercent).toFixed(2)}%
                </span>
              )}
              {marketDate && (
                <span className="quoteUpdated" title={`Último cierre de mercado: ${fullDateFormatter.format(marketDate)} hs`}>
                  Act. {timeFormatter.format(marketDate)} hs
                </span>
              )}
            </div>

            {expandida && historico && (
              <HistoricoPanel
                serie={historico}
                rango={rango}
                onRangoChange={setRango}
                formatValor={(valor) => priceFormatter.format(valor)}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
