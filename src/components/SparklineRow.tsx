import Sparkline from "./Sparkline";

interface Props {
  /** null mientras la serie no llegó: la fila igual reserva su alto */
  valores: number[] | null;
  expandida: boolean;
  /** Sin serie utilizable no mostramos el chevron, porque no hay nada que abrir */
  expandible: boolean;
}

// Fila del mini gráfico. Antes la única señal de que la tarjeta se despliega
// era un chevron suelto, del mismo color apagado que el gráfico: se leía como
// parte de la decoración, no como un control. Ahora es un chip con fondo
// propio y, cuando entra, la palabra "Histórico" — se ve, punto, en vez de
// depender de que alguien pruebe a tocar cualquier parte de la tarjeta.
export default function SparklineRow({ valores, expandida, expandible }: Props) {
  return (
    <div className="sparklineWrap">
      {!expandida && valores && <Sparkline valores={valores} height={26} />}
      {expandible && (
        <span className={`sparklineChip ${expandida ? "sparklineChip--abierto" : ""}`}>
          {!expandida && <span className="sparklineChip__label">Histórico</span>}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </div>
  );
}
