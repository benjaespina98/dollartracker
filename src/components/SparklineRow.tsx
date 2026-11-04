import Sparkline from "./Sparkline";

interface Props {
  /** null mientras la serie no llegó: la fila igual reserva su alto */
  valores: number[] | null;
  expandida: boolean;
  /** Sin serie utilizable no mostramos el chevron, porque no hay nada que abrir */
  expandible: boolean;
  /** Solo se usa expandida: cerrar la tarjeta. Cerrado, el cuerpo entero ya es clickeable. */
  onCerrar: () => void;
}

// Fila del mini gráfico. Antes la única señal de que la tarjeta se despliega
// era un chevron suelto, del mismo color apagado que el gráfico: se leía como
// parte de la decoración, no como un control. Ahora es un chip con fondo
// propio y, cuando entra, la palabra "Histórico" — se ve, punto, en vez de
// depender de que alguien pruebe a tocar cualquier parte de la tarjeta.
//
// Cerrada, el chip va dentro del cuerpo clickeable (CardShell le pone
// onClick={abrir} a todo el quoteBody), así que un <span> alcanza. Abierta,
// ese onClick del cuerpo se saca (ver `abrible` en CardShell) porque tocar el
// gráfico o los botones de rango no puede cerrar la tarjeta por accidente —
// pero eso dejaba el chevron, ahora apuntando hacia arriba, sin ningún
// handler: parecía un botón de "cerrar" y no hacía nada. Por eso acá sí es un
// <button> real que llama a onCerrar.
export default function SparklineRow({ valores, expandida, expandible, onCerrar }: Props) {
  return (
    <div className="sparklineWrap">
      {!expandida && valores && <Sparkline valores={valores} height={26} />}
      {expandible &&
        (expandida ? (
          <button
            type="button"
            className="sparklineChip sparklineChip--abierto"
            onClick={onCerrar}
            aria-label="Cerrar histórico"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
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
        ))}
    </div>
  );
}
