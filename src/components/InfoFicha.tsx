interface Props {
  /** Proveedor de los datos mostrados (puede ser más de uno, separados por el llamante) */
  fuente: string;
  /** Ticker, par o símbolo usado para obtener la cotización */
  referencia?: string;
  /** Etiqueta de la fila de referencia; "Par" por defecto (cripto), "Ticker" para ETF */
  referenciaLabel?: string;
  /** Subyacente o índice que el instrumento aproxima, cuando no coinciden */
  subyacente?: string;
  moneda?: string;
}

// Ficha técnica compacta (fuente, par/ticker, subyacente, moneda) al pie del
// panel de información de cada instrumento. Mismo formato en toda la app para
// que la procedencia del dato sea siempre fácil de ubicar y comparar.
export function InfoFicha({ fuente, referencia, referenciaLabel = "Par", subyacente, moneda }: Props) {
  return (
    <dl className="infoFicha">
      <div>
        <dt>Fuente</dt>
        <dd>{fuente}</dd>
      </div>
      {referencia && (
        <div>
          <dt>{referenciaLabel}</dt>
          <dd>{referencia}</dd>
        </div>
      )}
      {subyacente && (
        <div>
          <dt>Subyacente</dt>
          <dd>{subyacente}</dd>
        </div>
      )}
      {moneda && (
        <div>
          <dt>Moneda</dt>
          <dd>{moneda}</dd>
        </div>
      )}
    </dl>
  );
}
