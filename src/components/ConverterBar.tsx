import { MONEDAS_ORIGEN, formatearMontoTipeado, type MonedaOrigen } from "../lib/conversion";

interface Props {
  monto: string;
  origen: MonedaOrigen;
  onMontoChange: (valor: string) => void;
  onOrigenChange: (origen: MonedaOrigen) => void;
}

export default function ConverterBar({ monto, origen, onMontoChange, onOrigenChange }: Props) {
  const activa = MONEDAS_ORIGEN.find((m) => m.codigo === origen) ?? MONEDAS_ORIGEN[0];

  return (
    <div className="converter">
      <div className="converter__field">
        <span className="converter__prefix" aria-hidden="true">
          {activa.simbolo}
        </span>
        <input
          className="converter__input"
          value={monto}
          onChange={(e) => onMontoChange(e.target.value)}
          onBlur={() => onMontoChange(formatearMontoTipeado(monto))}
          // inputMode decimal abre el teclado numérico en el celular sin
          // rechazar los puntos y comas que la gente escribe por costumbre
          inputMode="decimal"
          type="text"
          placeholder={`Convertí un monto en ${activa.nombre}`}
          aria-label={`Monto en ${activa.nombre} a convertir`}
        />
        {monto !== "" && (
          <button
            className="converter__clear"
            onClick={() => onMontoChange("")}
            type="button"
            aria-label="Borrar el monto"
            title="Borrar"
          >
            ✕
          </button>
        )}
      </div>

      <div className="monedaTabs" role="group" aria-label="Moneda del monto que estás escribiendo">
        {MONEDAS_ORIGEN.map(({ codigo, nombre }) => (
          <button
            key={codigo}
            type="button"
            className={`monedaTab ${codigo === origen ? "monedaTab--activa" : ""}`}
            onClick={() => onOrigenChange(codigo)}
            aria-pressed={codigo === origen}
            title={`Escribir el monto en ${nombre}`}
          >
            {codigo}
          </button>
        ))}
      </div>
    </div>
  );
}
