import Sparkline from "./Sparkline";

interface Props {
  /** null mientras la serie no llegó: la fila igual reserva su alto */
  valores: number[] | null;
  expandida: boolean;
  /** Sin serie utilizable no mostramos el chip, porque no hay nada que abrir */
  expandible: boolean;
}

// Fila del mini gráfico, con un chip "Histórico" al lado: antes la única
// señal de que la tarjeta se despliega era un chevron suelto, del mismo color
// apagado que el gráfico, que se leía como parte de la decoración y no como
// un control. Solo aparece cerrada: una vez abierta, la tarjeta ya tiene su
// propia X (y el fondo, y Escape, y deslizar) para cerrarse — repetir acá un
// botón sin el resto de la fila alrededor quedaba como una flechita flotando
// sola, sin pinta de control y sin agregar ninguna forma de cerrar que no
// hubiera ya.
export default function SparklineRow({ valores, expandida, expandible }: Props) {
  if (expandida) return null;

  return (
    <div className="sparklineWrap">
      {valores && <Sparkline valores={valores} height={26} />}
      {expandible && (
        <span className="sparklineChip">
          <span className="sparklineChip__label">Histórico</span>
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
