import type { SVGProps } from "react";

// Set de íconos de línea, minimalistas, coloreados vía currentColor
// (heredan el acento de cada tarjeta). Mismo lenguaje visual que los
// íconos de tema/copiar ya usados en la app.

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

// Dólar Oficial: banco
export function IconBank(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 3 2.5 8.5h19L12 3Z" />
      <path d="M4.5 21V10.5M9 21V10.5M15 21V10.5M19.5 21V10.5" />
      <path d="M2.5 21h19" />
    </Svg>
  );
}

// Blue: intercambio informal
export function IconSwap(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M4 8h14l-3.5-3.5" />
      <path d="M20 16H6l3.5 3.5" />
    </Svg>
  );
}

// MEP / Bolsa: velas de mercado
export function IconCandles(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M6 3v3M6 12v9M6 6h0" />
      <rect x="4" y="6" width="4" height="6" rx="1" fill="currentColor" stroke="none" />
      <path d="M12 3v6M12 15v6" />
      <rect x="10" y="9" width="4" height="6" rx="1" fill="currentColor" stroke="none" />
      <path d="M18 3v10M18 19v2" />
      <rect x="16" y="13" width="4" height="6" rx="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

// CCL: internacional
export function IconGlobe(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.8 2.6 2.8 15.4 0 18" />
      <path d="M12 3c-2.8 2.6-2.8 15.4 0 18" />
    </Svg>
  );
}

// Cripto: hexágono blockchain
export function IconCrypto(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 2.5 20 7v10l-8 4.5-8-4.5V7l8-4.5Z" />
      <path d="M12 8v8M9 10l3-1.5 3 1.5-3 1.5-3-1.5Z" />
    </Svg>
  );
}

// Tarjeta: credit card
export function IconCard(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.2" />
      <path d="M2.5 10h19" />
    </Svg>
  );
}

// Riesgo País: pulso / volatilidad
export function IconPulse(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M2.5 13h4l2 6 4-14 2 8 1.5-4h5.5" />
    </Svg>
  );
}

// Petróleo: gota
export function IconDroplet(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 2.5c4.2 5.2 6.3 8.6 6.3 11.3a6.3 6.3 0 1 1-12.6 0c0-2.7 2.1-6.1 6.3-11.3Z" />
    </Svg>
  );
}

// Oro: lingote
export function IconIngot(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M6.5 8h11l3.2 9H3.3l3.2-9Z" />
      <path d="M9 8 7.5 5h9L15 8" />
    </Svg>
  );
}

// Índices/ETFs (SPY, Dow, Nasdaq): tendencia
export function IconTrend(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M3 16.5 9.5 10l4 4L21 6.5" />
      <path d="M15.5 6.5H21v5.5" />
    </Svg>
  );
}

// Soja: vaina con granos
export function IconSoy(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M6.6 17.4c-2.4-2.4-2.4-6.3 0-8.7l2.1-2.1c2.4-2.4 6.3-2.4 8.7 0s2.4 6.3 0 8.7l-2.1 2.1c-2.4 2.4-6.3 2.4-8.7 0Z" />
      <path d="m9.5 14.5 1.8-1.8M12.7 11.3l1.8-1.8" />
    </Svg>
  );
}

// Maíz: espiga
export function IconCorn(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 21V10.5" />
      <path d="M12 10.5c0-4 1.9-7.5 4.7-8.2.7 2.8-.8 6.4-4.7 8.2Z" />
      <path d="M12 10.5C12 6.5 10.1 3 7.3 2.3 6.6 5.1 8.1 8.7 12 10.5Z" />
      <path d="M12 16c2.6-.6 4.4-2.4 4.6-4.6-2.3.2-4 1.9-4.6 4.6Z" />
    </Svg>
  );
}

// Trigo: grano con hojas
export function IconWheat(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 21.5V9" />
      <path d="M12 9c1.9-1.4 1.9-4.1 0-5.5-1.9 1.4-1.9 4.1 0 5.5Z" />
      <path d="M12 14c1.9-1.4 4.5-.9 5.5 1-2 1.1-4.5.5-5.5-1Z" />
      <path d="M12 14c-1.9-1.4-4.5-.9-5.5 1 2 1.1 4.5.5 5.5-1Z" />
    </Svg>
  );
}

// Euro / Real: glifo de moneda
export function IconGlyph({ glyph }: { glyph: string }) {
  return (
    <span className="quoteIconGlyph" aria-hidden="true">
      {glyph}
    </span>
  );
}
