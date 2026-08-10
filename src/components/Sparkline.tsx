import { useId } from "react";

interface Props {
  valores: number[];
  height: number;
  /** El gráfico grande agrega el relleno degradado bajo la línea */
  conArea?: boolean;
}

// El SVG se dibuja siempre en una grilla de 100 x height y se estira al ancho
// real con preserveAspectRatio="none". Eso deforma el trazo, así que la línea
// usa vector-effect="non-scaling-stroke" para mantener 2px reales siempre.
const ANCHO = 100;

export default function Sparkline({ valores, height, conArea = false }: Props) {
  const gradientId = useId();

  if (valores.length < 2) return null;

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min;

  const padY = 3;
  const alto = height - padY * 2;

  const coords = valores.map((valor, i) => {
    const x = (i / (valores.length - 1)) * ANCHO;
    // Serie plana: una línea al medio en vez de dividir por cero
    const proporcion = rango === 0 ? 0.5 : (valor - min) / rango;
    const y = padY + alto - proporcion * alto;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const linea = coords.join(" ");
  const area = `${coords[0].split(",")[0]},${height} ${linea} ${coords[coords.length - 1].split(",")[0]},${height}`;

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${ANCHO} ${height}`}
      preserveAspectRatio="none"
      style={{ height }}
      aria-hidden="true"
      focusable="false"
    >
      {conArea && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill={`url(#${gradientId})`} />
        </>
      )}
      <polyline
        points={linea}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
