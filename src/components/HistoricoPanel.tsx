import { RANGOS, recortarRango, type RangoDias, type SeriePunto } from "../useHistorico";
import Sparkline from "./Sparkline";

interface Props {
  serie: SeriePunto[];
  rango: RangoDias;
  onRangoChange: (dias: RangoDias) => void;
  /** Cada tarjeta formatea distinto: pesos, dólares o puntos básicos */
  formatValor: (valor: number) => string;
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });

function formatFecha(fecha: string): string {
  // Mediodía para que el desfasaje UTC no corra la fecha un día
  return dateFormatter.format(new Date(`${fecha}T12:00:00`));
}

export default function HistoricoPanel({ serie, rango, onRangoChange, formatValor }: Props) {
  const recorte = recortarRango(serie, rango);
  const valores = recorte.map((p) => p.valor);

  return (
    <div className="historico">
      <div className="historico__chart">
        <Sparkline valores={valores} height={130} conArea />
      </div>

      <div className="historico__extremos">
        <span>mín {formatValor(Math.min(...valores))}</span>
        <span>máx {formatValor(Math.max(...valores))}</span>
      </div>

      <div className="historico__fechas">
        <span>{formatFecha(recorte[0].fecha)}</span>
        <span>{formatFecha(recorte[recorte.length - 1].fecha)}</span>
      </div>

      {/* stopPropagation: si no, elegir un rango cerraría la tarjeta */}
      <div className="historico__rangos" onClick={(e) => e.stopPropagation()}>
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
