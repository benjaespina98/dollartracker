// Genera la imagen de vista previa (Open Graph / Twitter Card) en
// public/og-image.png, a partir de una composición SVG propia (no es una
// captura de la app: la pantalla principal muestra cotizaciones en vivo que
// quedarían desactualizadas en una imagen que Google/LinkedIn/WhatsApp
// cachean por días).
//
// Repetir cuando cambien TITULO, DESCRIPCION o el diseño de la tarjeta:
//   node scripts/generate-og-image.mjs
//
// TITULO y DESCRIPCION tienen que coincidir con los mismos valores en
// index.html (<title>, meta description, og:title, twitter:title, etc.):
// no se leen de ahí para no acoplar este script al parseo de HTML.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const TITULO = "DollarTracker | Dólar, riesgo país y mercados";
const DESCRIPCION = "PWA con cotizaciones del dólar, riesgo país y mercados, con historial y modo sin conexión.";

const ANCHO = 1200;
const ALTO = 630;
const MARGEN = 60;

const escapar = (texto) =>
  texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Corta `texto` en líneas de hasta `maxChars`, sin partir palabras. */
function envolver(texto, maxChars) {
  const palabras = texto.split(" ");
  const lineas = [];
  let actual = "";
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length > maxChars && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidata;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

const [nombre, tagline] = TITULO.split(" | ");
const lineasDescripcion = envolver(DESCRIPCION, 58);

const FUENTE = "Segoe UI, Arial, sans-serif";
const CHIPS = [
  { label: "Oficial", color: "#4ade80" },
  { label: "Blue", color: "#78beff" },
  { label: "Riesgo país", color: "#f87171" },
  { label: "Cripto", color: "#facc15" },
];

const chipAncho = (ANCHO - MARGEN * 2 - (CHIPS.length - 1) * 24) / CHIPS.length;
const chipsSvg = CHIPS.map((chip, i) => {
  const x = MARGEN + i * (chipAncho + 24);
  return `
    <g transform="translate(${x},440)">
      <rect width="${chipAncho}" height="84" rx="14" fill="#ffffff" opacity="0.05" stroke="#ffffff" stroke-opacity="0.12"/>
      <circle cx="32" cy="42" r="7" fill="${chip.color}"/>
      <text x="52" y="50" font-size="25" font-weight="600" fill="#e0e0e0">${escapar(chip.label)}</text>
    </g>`;
}).join("");

const descripcionSvg = lineasDescripcion
  .map((linea, i) => `<text x="${MARGEN}" y="${328 + i * 36}" font-size="27" fill="#a8a8a8">${escapar(linea)}</text>`)
  .join("\n  ");

const svg = `<svg width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#121212"/>
      <stop offset="100%" stop-color="#1c2532"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="100%" stop-color="#78beff"/>
    </linearGradient>
  </defs>

  <rect width="${ANCHO}" height="${ALTO}" fill="url(#bg)"/>
  <circle cx="1080" cy="90" r="220" fill="#4ade80" opacity="0.06"/>
  <circle cx="120" cy="560" r="260" fill="#78beff" opacity="0.06"/>
  <rect x="0" y="0" width="${ANCHO}" height="8" fill="url(#accent)"/>

  <text x="${MARGEN}" y="218" font-family="${FUENTE}" font-size="72" font-weight="700" fill="#f5f5f5" letter-spacing="-2">${escapar(nombre)}</text>
  <text x="${MARGEN}" y="268" font-family="${FUENTE}" font-size="36" font-weight="600" fill="#78beff">${escapar(tagline ?? "")}</text>

  <g font-family="${FUENTE}">
    ${descripcionSvg}
  </g>

  <g font-family="${FUENTE}">${chipsSvg}
  </g>

  <text x="${MARGEN}" y="558" font-family="${FUENTE}" font-size="22" fill="#6b6b6b">React · TypeScript · Vite · PWA</text>
  <text x="${ANCHO - MARGEN}" y="562" font-family="${FUENTE}" font-size="38" font-weight="700" fill="url(#accent)" text-anchor="end">$</text>
</svg>
`;

const raiz = fileURLToPath(new URL("..", import.meta.url));
const rutaSvg = `${raiz}public/og-image.svg`;
const rutaPng = `${raiz}public/og-image.png`;

await writeFile(rutaSvg, svg, "utf-8");

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
await writeFile(rutaPng, png);

console.log(`OK: public/og-image.svg y public/og-image.png (${(png.length / 1024).toFixed(1)} KB)`);
