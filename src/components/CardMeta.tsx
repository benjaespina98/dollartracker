// Los tres elementos de la fila inferior de las tarjetas. Estaban escritos a
// mano en cada una, con umbrales y clases repetidos.

interface VariacionProps {
  /** Signo del cambio: define color y flecha */
  valor: number;
  /** Ya formateado ("1,24%", "12 pb") */
  texto: string;
  title: string;
}

// El umbral evita que un redondeo de 0,0004% se pinte de verde.
const PLANO = 0.001;

export function Variacion({ valor, texto, title }: VariacionProps) {
  const tono = valor > PLANO ? "up" : valor < -PLANO ? "down" : "flat";
  const flecha = tono === "up" ? "▲" : tono === "down" ? "▼" : "●";

  return (
    <span className={`quoteVariation ${tono}`} title={title}>
      <span aria-hidden="true">{flecha}</span> {texto}
    </span>
  );
}

interface HoraProps {
  texto: string;
  title: string;
}

// Antes decía "Actualizado a las 12:30 hs" en cada una de las 16 tarjetas.
// El reloj dice lo mismo ocupando un cuarto del ancho.
export function HoraDato({ texto, title }: HoraProps) {
  return (
    <span className="quoteUpdated" title={title}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 7.5V12l3 2" />
      </svg>
      <span className="visuallyHidden">Dato de las </span>
      {texto}
    </span>
  );
}

export function OfflineTag({ title }: { title: string }) {
  return (
    <span className="offlineTag" title={title}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M2 2l20 20" />
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M5 12.5a10 10 0 0 1 4-2.4M15.4 10.4a10 10 0 0 1 3.6 2.1M8.5 16a5.5 5.5 0 0 1 7 0"
        />
        <circle cx="12" cy="19.5" r="1.2" fill="currentColor" />
      </svg>
      Sin conexión
    </span>
  );
}
