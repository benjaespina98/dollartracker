import Sparkline from "./Sparkline";

interface Props {
  /** null mientras la serie no llegó: la fila igual reserva su alto */
  valores: number[] | null;
  expandida: boolean;
  /** Sin serie utilizable no mostramos el chevron, porque no hay nada que abrir */
  expandible: boolean;
}

// Fila del mini gráfico. Además del sparkline lleva el chevron, que es la
// única señal visible de que la tarjeta se despliega: sin él nadie descubría
// que se podía tocar.
export default function SparklineRow({ valores, expandida, expandible }: Props) {
  return (
    <div className="sparklineWrap">
      {!expandida && valores && <Sparkline valores={valores} height={26} />}
      {expandible && (
        <svg
          className={`sparklineChevron ${expandida ? "sparklineChevron--abierto" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
