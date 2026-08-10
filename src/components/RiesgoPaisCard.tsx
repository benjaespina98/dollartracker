import { useCallback, useState, type CSSProperties, type ReactNode } from "react";
import { cierreAnterior } from "../fechas";
import { recortarRango, useHistoricoRiesgoPais, type RangoDias } from "../useHistorico";
import { useModalCard } from "../useModalCard";
import type { RiesgoPais } from "../types";
import { CardBackdrop, CardCloseButton, CardInfoButton, CardInfoPanel } from "./ExpandedChrome";
import HistoricoPanel from "./HistoricoPanel";
import SparklineRow from "./SparklineRow";

interface Props {
  icon: ReactNode;
  accent: string;
  data: RiesgoPais | null;
  previousValor: number | null;
  status: "loading" | "ready" | "stale" | "error";
}

const valueFormatter = new Intl.NumberFormat("es-AR");

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
});

// Umbrales informales usados habitualmente para leer el índice de riesgo país
function getCategory(valor: number): { label: string; tone: "low" | "medium" | "high" | "critical" } {
  if (valor < 400) return { label: "Riesgo bajo", tone: "low" };
  if (valor < 800) return { label: "Riesgo moderado", tone: "medium" };
  if (valor < 1500) return { label: "Riesgo alto", tone: "high" };
  return { label: "Riesgo crítico", tone: "critical" };
}

export default function RiesgoPaisCard({ icon, accent, data, previousValor, status }: Props) {
  const [copied, setCopied] = useState(false);
  const [expandida, setExpandida] = useState(false);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [rango, setRango] = useState<RangoDias>(30);

  const historico = useHistoricoRiesgoPais();
  // Sin datos no hay nada que desplegar: la tarjeta no debe parecer clickeable
  const puedeExpandirse = !!data && (historico?.length ?? 0) >= 2;
  const serieMini = historico ? recortarRango(historico, 30) : null;

  // Preferimos el cierre anterior del histórico (siempre disponible) sobre
  // previousValor (solo existe después del primer refresh de esta sesión):
  // si no, al abrir la app recién no había con qué comparar y el ▲/▼ no
  // aparecía hasta el siguiente refresh automático.
  const cierrePrevio = cierreAnterior(historico);
  const diff =
    data && cierrePrevio
      ? data.valor - cierrePrevio.valor
      : data && previousValor !== null
        ? data.valor - previousValor
        : null;

  const cerrar = useCallback(() => {
    setExpandida(false);
    setMostrarInfo(false);
  }, []);
  useModalCard(expandida, cerrar);

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
    <>
      {expandida && <CardBackdrop onClose={cerrar} />}
      <section
        className={`quoteCard ${expandida ? "quoteCard--expandida" : ""}`}
        style={{ "--accent": accent } as CSSProperties}
      >
      <header className="quoteHeader">
        <div className="quoteTitleGroup">
          <span className="quoteIcon">{icon}</span>
          <h2 className="quoteTitle">Riesgo País</h2>
        </div>
        {expandida && (
          <>
            <CardInfoButton
              activo={mostrarInfo}
              onToggle={() => setMostrarInfo((v) => !v)}
              label="Qué estoy viendo: riesgo país"
            />
            <CardCloseButton onClose={cerrar} label="Cerrar histórico de riesgo país" />
          </>
        )}
        {data && !expandida && (
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
        aria-label={puedeExpandirse ? "Riesgo País: ver histórico" : undefined}
      >
        {status === "loading" && !data && (
          <div className="skeleton" aria-label="Cargando riesgo país">
            <span className="skeletonBlock" />
          </div>
        )}
        {status === "error" && !data && <span className="quoteError">⚠ No se pudo obtener el dato</span>}

        {data &&
          (() => {
            const category = getCategory(data.valor);
            return (
              <>
                {expandida && mostrarInfo && (
                  <CardInfoPanel>
                    El EMBI+ mide, en puntos básicos, cuánto más pagaría Argentina que el Tesoro de EE. UU. para
                    financiarse: a mayor valor, mayor riesgo de default percibido por el mercado. El gráfico
                    muestra su cierre diario, con mínimo y máximo del período. Datos de ArgentinaDatos.
                  </CardInfoPanel>
                )}

                <div className="riesgoBlock">
                  <span className="riesgoBlock__label">EMBI+ Argentina</span>
                  <div className="riesgoBlock__row">
                    <span className="riesgoBlock__value">{valueFormatter.format(data.valor)}</span>
                    <span className="riesgoBlock__unit">puntos básicos</span>
                  </div>
                </div>

                {/* Hueco reservado para que la tarjeta no salte cuando llega la serie */}
                <SparklineRow
                  valores={serieMini?.map((p) => p.valor) ?? null}
                  expandida={expandida}
                  expandible={puedeExpandirse}
                />

                <div className="quoteMeta">
                  {status === "stale" ? (
                    <span
                      className="offlineTag"
                      title={`No se pudo actualizar; este es el último valor guardado en este dispositivo, del ${dateFormatter.format(
                        new Date(`${data.fecha}T12:00:00`)
                      )}`}
                    >
                      ⚠ Modo sin conexión · datos del {dateFormatter.format(new Date(`${data.fecha}T12:00:00`))}
                    </span>
                  ) : (
                    <span
                      className={`riesgoTag riesgoTag--${category.tone}`}
                      title="Categoría orientativa según umbrales de mercado habituales, no es un dato oficial"
                    >
                      {category.label}
                    </span>
                  )}
                  {status !== "stale" && diff !== null && (
                    <span className="quoteVariationGroup">
                      <span className={`quoteVariation ${diff > 0 ? "up" : diff < 0 ? "down" : "flat"}`}>
                        {diff > 0 ? "▲" : diff < 0 ? "▼" : "●"} {Math.abs(diff)} pb
                      </span>
                      <span className="quoteVariationLabel">vs. Cierre Ayer</span>
                    </span>
                  )}
                  {/* Va dentro de quoteMeta como en las otras tarjetas: antes
                      colgaba suelto abajo y dejaba un hueco raro en desktop */}
                  <span className="quoteUpdated" title={`Último dato informado: ${data.fecha}`}>
                    Cierre del {dateFormatter.format(new Date(`${data.fecha}T12:00:00`))}
                  </span>
                </div>

                {expandida && historico && (
                  <HistoricoPanel
                    serie={historico}
                    rango={rango}
                    onRangoChange={setRango}
                    formatValor={(valor) => `${valueFormatter.format(Math.round(valor))} pb`}
                  />
                )}
              </>
            );
          })()}
      </div>
      </section>
    </>
  );
}
