import { useState } from "react";
import { canvasABlob, dibujarResumen, type ResumenDatos } from "../lib/resumenImagen";

const URL_APP = "https://dollartracker.vercel.app/";

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
          // Sin "title"/"text" fijo: WhatsApp lo mostraba como una línea de
          // texto suelta ("DollarTracker") al lado de la imagen, sin ningún
          // link. Pasar la URL de la app en "text" hace que WhatsApp la
          // detecte y la muestre como un link tocable en vez de texto plano.
          await navigator.share({ files: [archivo], text: URL_APP });
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
      {/* Ícono estándar de "compartir" (flecha saliendo de una bandeja, el
          mismo lenguaje que usan iOS/Android): antes era un ícono de
          "imagen" que en celular, sin la palabra "Resumen" al lado, no
          comunicaba que tocarlo abre el menú de compartir. */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15.5V4M8 8l4-4 4 4"
        />
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        />
      </svg>
      <span className="resumenBtn__label">{generando ? "Generando…" : "Resumen"}</span>
    </button>
  );
}
