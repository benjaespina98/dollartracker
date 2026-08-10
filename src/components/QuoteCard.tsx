import { useState, type CSSProperties, type ReactNode } from "react";
import { convertir, formatearMoneda, type MonedaOrigen } from "../conversion";
import { cierreAnterior } from "../fechas";
import { recortarRango, tieneHistorico, useHistoricoDolar, type RangoDias } from "../useHistorico";
import type { Cotizacion } from "../types";
import HistoricoPanel from "./HistoricoPanel";
import SparklineRow from "./SparklineRow";

interface Props {
  /** Clave de la casa en DolarAPI; también es el slug del histórico */
  casa: string;
  label: string;
  /** Nombre completo, para el tooltip y los lectores de pantalla */
  nombre: string;
  icon: ReactNode;
  accent: string;
  data: Cotizacion | null;
  previousVenta: number | null;
  status: "loading" | "ready" | "stale" | "error";
  /** Monto tipeado en la barra conversora, null si está vacía */
  monto: number | null;
  origen: MonedaOrigen;
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

export default function QuoteCard({
  casa,
  label,
  nombre,
  icon,
  accent,
  data,
  previousVenta,
  status,
  monto,
  origen,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [expandida, setExpandida] = useState(false);
  const [rango, setRango] = useState<RangoDias>(30);

  const historico = useHistoricoDolar(casa);
  const puedeVerHistorico = tieneHistorico(casa);
  // Sin datos no hay nada que desplegar: la tarjeta no debe parecer clickeable
  const puedeExpandirse = !!data && (historico?.length ?? 0) >= 2;
  // El mini siempre muestra 30 días; el rango elegido solo afecta al grande
  const serieMini = historico ? recortarRango(historico, 30) : null;

  // Las tarjetas de mercado muestran la variación contra el cierre anterior
  // (viene de Twelve Data). Acá mostrábamos la variación desde que se abrió la
  // app, que con el mismo ▲ verde significaba algo completamente distinto.
  // Con el histórico disponible calculamos lo mismo: contra el último cierre
  // previo a hoy. Euro y real no tienen serie, así que ahí seguimos con la
  // variación de sesión y el tooltip lo aclara.
  const cierrePrevio = cierreAnterior(historico);

  const variation =
    data && cierrePrevio && cierrePrevio.valor !== 0
      ? ((data.venta - cierrePrevio.valor) / cierrePrevio.valor) * 100
      : data && previousVenta !== null && previousVenta !== 0
        ? ((data.venta - previousVenta) / previousVenta) * 100
        : null;

  const variationTitle = cierrePrevio
    ? `Variación de la venta contra el cierre del ${cierrePrevio.fecha.split("-").reverse().slice(0, 2).join("/")} (${currencyFormatter.format(cierrePrevio.valor)})`
    : "Variación de la venta desde que abriste la app: esta cotización no tiene serie histórica disponible";

  // Con monto cargado la tarjeta deja de mostrar compra/venta y pasa a
  // responder "cuánto me dan": es el modo conversión.
  // Devuelve null cuando esta tarjeta no aplica al origen elegido (por ejemplo
  // escribiste euros y esta es una tarjeta de dólar): ahí seguimos con compra/venta.
  const convertido =
    data && monto !== null ? convertir(monto, origen, data.moneda, data.compra, data.venta) : null;

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
    <section
      className={`quoteCard ${expandida ? "quoteCard--expandida" : ""}`}
      style={{ "--accent": accent } as CSSProperties}
    >
      <header className="quoteHeader">
        <div className="quoteTitleGroup">
          <span className="quoteIcon">{icon}</span>
          <h2 className="quoteTitle" title={nombre}>
            <span className="visuallyHidden">{nombre}</span>
            <span aria-hidden="true">{label}</span>
          </h2>
        </div>
        {data && (
          <button
            className={`shareBtn ${copied ? "shareBtn--copied" : ""}`}
            onClick={handleShare}
            type="button"
            aria-label={`Compartir cotización de ${nombre}`}
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
        aria-label={puedeExpandirse ? `${nombre}: ver histórico` : undefined}
      >
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
            {convertido !== null ? (
              <div className="convertedBlock">
                <span className="convertedBlock__value">
                  {formatearMoneda(convertido.valor, convertido.moneda)}
                </span>
                <span className="convertedBlock__rate">
                  a {currencyFormatter.format(convertido.tasa)} ({convertido.punta})
                </span>
              </div>
            ) : (
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
            )}

            {/* El hueco se reserva desde el vamos aunque la serie todavía no
                haya llegado: si no, las tarjetas pegaban un salto al aparecer
                el gráfico unos milisegundos después del precio. */}
            {puedeVerHistorico && (
              <SparklineRow
                valores={serieMini?.map((p) => p.valor) ?? null}
                expandida={expandida}
                expandible={puedeExpandirse}
              />
            )}

            <div className="quoteMeta">
              {status === "stale" && (
                <span className="offlineTag" title="No se pudo actualizar; este es el último valor guardado en este dispositivo">
                  ⚠ Sin conexión
                </span>
              )}
              {status !== "stale" && variation !== null && Math.abs(variation) > 0.001 && (
                <span
                  className={`quoteVariation ${variation > 0 ? "up" : "down"}`}
                  title={variationTitle}
                >
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

            {expandida && historico && (
              <HistoricoPanel
                serie={historico}
                rango={rango}
                onRangoChange={setRango}
                formatValor={(valor) => currencyFormatter.format(valor)}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
