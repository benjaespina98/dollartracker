import { RANGOS, recortarRango, type RangoDias, type SeriePunto } from "../hooks/useHistorico";
import { useTocarGrafico } from "../hooks/useTocarGrafico";
import Sparkline from "./Sparkline";

interface Props {
  serie: SeriePunto[];
  rango: RangoDias;
  onRangoChange: (dias: RangoDias) => void;
  /** Cada tarjeta formatea distinto: pesos, dólares o puntos básicos */
  formatValor: (valor: number) => string;
}

// Mismo alto que se le pasa a <Sparkline>: hace falta acá también para
// ubicar el punto tocado a la altura exacta de la línea (ver useTocarGrafico
// y los comentarios de Sparkline sobre por qué ese cálculo no sale del SVG).
const ALTO_GRAFICO = 130;
const PAD_Y = 3;

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });

function formatFecha(fecha: string): string {
  // Mediodía para que el desfasaje UTC no corra la fecha un día
  return dateFormatter.format(new Date(`${fecha}T12:00:00`));
}

export default function HistoricoPanel({ serie, rango, onRangoChange, formatValor }: Props) {
  const recorte = recortarRango(serie, rango);
  const valores = recorte.map((p) => p.valor);
  const { ref: chartRef, indice: indiceActivo } = useTocarGrafico(valores.length);
  const puntoActivo = indiceActivo !== null ? recorte[indiceActivo] : null;

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rangoValores = max - min;
  const alto = ALTO_GRAFICO - PAD_Y * 2;
  // El gráfico se achica en pantallas chicas (ver el clamp() de .sparkline
  // en App.css), así que la altura real nunca es ALTO_GRAFICO; expresar la
  // posición como % de ese alto de referencia da la misma proporción sea
  // cual sea el alto final, porque el navegador escala el SVG entero por
  // igual (mismo viewBox) y acá replicamos esa misma escala.
  const xPct = indiceActivo !== null ? (indiceActivo / (valores.length - 1)) * 100 : 0;
  const yPct = puntoActivo
    ? ((PAD_Y + alto - (rangoValores === 0 ? 0.5 : (puntoActivo.valor - min) / rangoValores) * alto) / ALTO_GRAFICO) *
      100
    : 0;

  return (
    <div className="historico">
      <div className="historico__chart">
        {/* Alto exacto del SVG (sin el padding-top de arriba): ahí adentro
            el % de posición del punto coincide con el que ve el navegador. */}
        <div className="historico__chartBox" ref={chartRef}>
          <Sparkline valores={valores} height={ALTO_GRAFICO} conArea indiceActivo={indiceActivo} />

          {puntoActivo && (
            <>
              {/* El punto en sí, a la altura real de la línea (ver Sparkline). */}
              <span
                className="historico__punto"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
                aria-hidden="true"
              />
              <div className="historico__tooltip" style={{ left: `${Math.min(88, Math.max(12, xPct))}%` }}>
                <span className="historico__tooltipValor">{formatValor(puntoActivo.valor)}</span>
                <span className="historico__tooltipFecha">{formatFecha(puntoActivo.fecha)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="historico__extremos">
        <span>mín {formatValor(Math.min(...valores))}</span>
        <span>máx {formatValor(Math.max(...valores))}</span>
      </div>

      <div className="historico__fechas">
        <span>{formatFecha(recorte[0].fecha)}</span>
        <span>{formatFecha(recorte[recorte.length - 1].fecha)}</span>
      </div>

      <div className="historico__rangos" role="group" aria-label="Período del gráfico">
        {RANGOS.map(({ dias, label }) => (
          <button
            key={dias}
            type="button"
            className={`rangoBtn ${rango === dias ? "rangoBtn--activo" : ""}`}
            onClick={() => onRangoChange(dias)}
            aria-pressed={rango === dias}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
