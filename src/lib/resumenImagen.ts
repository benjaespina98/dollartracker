import { CURRENCY_SECTIONS } from "../config/cards";
import type { Cotizacion, RiesgoPais } from "../types";
import { pesos } from "./format";
import { categoriaRiesgoPais } from "./riesgoPais";

export interface ResumenFila {
  label: string;
  accent: string;
  compra: number;
  venta: number;
}

export interface ResumenDatos {
  fecha: string;
  dolares: ResumenFila[];
  riesgoPais: { valor: number; label: string } | null;
}

const fechaLarga = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Junta lo que hace falta para dibujar el resumen, a partir del mismo estado
 * que ya usa el resto de la app. Separado de dibujarResumen (que sí toca un
 * <canvas>) para poder probarlo sin nada gráfico de por medio.
 */
export function prepararResumen(
  cotizaciones: Record<string, { data: Cotizacion | null } | undefined>,
  riesgoPais: RiesgoPais | null
): ResumenDatos {
  // La sección "Dólar" de config/cards es la fuente única de qué casas van y
  // en qué orden: si mañana se agrega o saca una, el resumen no se desincroniza.
  const seccionDolar = CURRENCY_SECTIONS.find((s) => s.title === "Dólar");

  const dolares: ResumenFila[] = (seccionDolar?.cards ?? []).flatMap(({ key, label, accent }) => {
    const data = cotizaciones[key]?.data;
    return data ? [{ label, accent, compra: data.compra, venta: data.venta }] : [];
  });

  return {
    fecha: fechaLarga.format(new Date()),
    dolares,
    riesgoPais: riesgoPais ? { valor: riesgoPais.valor, label: categoriaRiesgoPais(riesgoPais.valor).label } : null,
  };
}

const ANCHO = 1080;
const ALTO = 1350;

// Paleta fija (no sigue el tema claro/oscuro de quien comparte): la imagen la
// va a ver gente que nunca abrió la app, así que tiene que verse igual de bien
// para todos, no depender de qué tema tenía activo quien la generó.
const COLOR = {
  bg: "#08090c",
  bgGlowA: "rgba(74, 222, 128, 0.12)",
  bgGlowB: "rgba(120, 190, 255, 0.10)",
  card: "#121419",
  cardBorder: "rgba(255, 255, 255, 0.09)",
  textStrong: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.6)",
  textFaint: "rgba(255, 255, 255, 0.46)",
  positive: "#4ade80",
  link: "#78beff",
};

function redondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Dibuja el resumen del día en un canvas nuevo y lo devuelve, listo para exportar a PNG. */
export function dibujarResumen(datos: ResumenDatos): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Fondo
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  const glow1 = ctx.createRadialGradient(ANCHO * 0.85, 60, 0, ANCHO * 0.85, 60, 520);
  glow1.addColorStop(0, COLOR.bgGlowA);
  glow1.addColorStop(1, "transparent");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  const glow2 = ctx.createRadialGradient(ANCHO * 0.1, ALTO * 0.95, 0, ANCHO * 0.1, ALTO * 0.95, 520);
  glow2.addColorStop(0, COLOR.bgGlowB);
  glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  const marginX = 64;

  // Marca
  const marcaGrad = ctx.createLinearGradient(marginX, 56, marginX + 76, 132);
  marcaGrad.addColorStop(0, "#4ade80");
  marcaGrad.addColorStop(1, "#78beff");
  ctx.fillStyle = marcaGrad;
  redondeado(ctx, marginX, 56, 76, 76, 20);
  ctx.fill();
  ctx.fillStyle = COLOR.bg;
  ctx.font = "800 44px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", marginX + 38, 56 + 40);

  ctx.textAlign = "left";
  ctx.fillStyle = COLOR.textStrong;
  ctx.font = "800 52px Inter, sans-serif";
  ctx.fillText("DollarTracker", marginX + 96, 92);
  ctx.fillStyle = COLOR.textMuted;
  ctx.font = "500 30px Inter, sans-serif";
  const fechaCapitalizada = datos.fecha.charAt(0).toUpperCase() + datos.fecha.slice(1);
  ctx.fillText(fechaCapitalizada, marginX + 96, 138);

  // Filas de dólar
  const filaAlto = 128;
  const filaGap = 18;
  let y = 196;

  for (const fila of datos.dolares) {
    redondeado(ctx, marginX, y, ANCHO - marginX * 2, filaAlto, 18);
    ctx.fillStyle = COLOR.card;
    ctx.fill();
    ctx.strokeStyle = COLOR.cardBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Barra de acento a la izquierda, como el borde superior de la tarjeta en la app
    ctx.fillStyle = fila.accent;
    redondeado(ctx, marginX, y, 8, filaAlto, 4);
    ctx.fill();

    ctx.fillStyle = COLOR.textStrong;
    ctx.font = "700 38px Inter, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(fila.label, marginX + 40, y + filaAlto / 2);

    const colCompraX = marginX + 430;
    const colVentaX = marginX + 730;

    ctx.textAlign = "left";
    ctx.fillStyle = COLOR.textFaint;
    ctx.font = "700 22px Inter, sans-serif";
    ctx.fillText("COMPRA", colCompraX, y + 42);
    ctx.fillText("VENTA", colVentaX, y + 42);

    ctx.fillStyle = COLOR.textStrong;
    ctx.font = "700 36px 'JetBrains Mono', monospace";
    ctx.fillText(pesos.format(fila.compra), colCompraX, y + 84);
    ctx.fillStyle = fila.accent;
    ctx.fillText(pesos.format(fila.venta), colVentaX, y + 84);

    y += filaAlto + filaGap;
  }

  // Riesgo país, si hay dato
  if (datos.riesgoPais) {
    redondeado(ctx, marginX, y, ANCHO - marginX * 2, filaAlto, 18);
    ctx.fillStyle = COLOR.card;
    ctx.fill();
    ctx.strokeStyle = COLOR.cardBorder;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ef4444";
    redondeado(ctx, marginX, y, 8, filaAlto, 4);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = COLOR.textStrong;
    ctx.font = "700 38px Inter, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("Riesgo País", marginX + 40, y + filaAlto / 2);

    ctx.font = "700 44px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    const valorTexto = `${new Intl.NumberFormat("es-AR").format(datos.riesgoPais.valor)} pb`;
    ctx.fillText(valorTexto, ANCHO - marginX - 40, y + filaAlto / 2 - 16);
    ctx.font = "600 26px Inter, sans-serif";
    ctx.fillStyle = COLOR.textMuted;
    ctx.fillText(datos.riesgoPais.label, ANCHO - marginX - 40, y + filaAlto / 2 + 24);

    y += filaAlto + filaGap;
  }

  // Pie
  ctx.textAlign = "center";
  ctx.fillStyle = COLOR.textFaint;
  ctx.font = "500 24px Inter, sans-serif";
  ctx.fillText("Datos de DolarAPI y ArgentinaDatos · valores de referencia", ANCHO / 2, ALTO - 76);
  ctx.fillStyle = COLOR.link;
  ctx.font = "700 26px Inter, sans-serif";
  ctx.fillText("dollartracker.vercel.app", ANCHO / 2, ALTO - 40);

  return canvas;
}

export function canvasABlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
