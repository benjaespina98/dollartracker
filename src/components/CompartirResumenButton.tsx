import { useState } from "react";
import { canvasABlob, dibujarResumen, type ResumenDatos } from "../lib/resumenImagen";

interface Props {
  datos: ResumenDatos;
  /** Sin al menos el oficial, la imagen saldría casi vacía */
  disabled: boolean;
}

// Comparable a lo que ya circula como "el dólar hoy" en WhatsApp/Twitter, pero
// generado en el momento con los datos reales de la app en vez de ser una
// captura de pantalla recortada a mano.
export default function CompartirResumenButton({ datos, disabled }: Props) {
  const [generando, setGenerando] = useState(false);

  async function compartir() {
    if (generando) return;
    setGenerando(true);
    try {
      // Sin esto el canvas puede dibujar con la tipografía de reserva del
      // sistema si Inter todavía no terminó de cargar en esta sesión.
      await document.fonts.ready;
      const canvas = dibujarResumen(datos);
      const blob = await canvasABlob(canvas);
      if (!blob) return;

      const archivo = new File([blob], "dollartracker-resumen.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [archivo] })) {
        try {
          await navigator.share({ files: [archivo], title: "DollarTracker" });
          return;
        } catch {
          // cancelado por quien comparte: no hace falta bajar el archivo igual
          return;
        }
      }

      // Sin Web Share (desktop, navegadores viejos): se baja el PNG directo.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "dollartracker-resumen.png";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <button
      className="resumenBtn"
      onClick={compartir}
      type="button"
      disabled={disabled || generando}
      title="Compartir el resumen del día como imagen"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4.5" width="18" height="14" rx="2.2" stroke="currentColor" strokeWidth="2" />
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m4 15 4.5-4.5a2 2 0 0 1 2.8 0L15 14.2M13.5 12.8l1.7-1.7a2 2 0 0 1 2.8 0L20 13.2"
        />
        <circle cx="8.2" cy="8.7" r="1.3" fill="currentColor" />
      </svg>
      <span className="resumenBtn__label">{generando ? "Generando…" : "Resumen"}</span>
    </button>
  );
}
