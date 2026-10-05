import { useState } from "react";
import { canvasABlob, dibujarResumen, type ResumenDatos } from "../lib/resumenImagen";
import { mostrarToast } from "../lib/toast";
import { IconShare } from "./icons";

const URL_APP = "https://dollartracker.vercel.app/";
const NOMBRE_ARCHIVO = "dollartracker-resumen.png";

interface Props {
  datos: ResumenDatos;
  /** Sin al menos el oficial, la imagen saldría casi vacía */
  disabled: boolean;
}

// Comparable a lo que ya circula como "el dólar hoy" en WhatsApp/Twitter, pero
// generado en el momento con los datos reales de la app en vez de ser una
// captura de pantalla recortada a mano. Un toque abre el menú nativo de
// compartir; sin él (escritorio) se baja el PNG.
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

      const archivo = new File([blob], NOMBRE_ARCHIVO, { type: "image/png" });

      if (navigator.canShare?.({ files: [archivo] })) {
        try {
          // La URL va en "text": WhatsApp la muestra como link tocable, en
          // vez de una línea de texto suelta junto a la imagen.
          await navigator.share({ files: [archivo], text: URL_APP });
        } catch {
          // cancelado por quien comparte: no hace falta bajar el archivo igual
        }
        return;
      }

      // Sin Web Share (desktop, navegadores viejos): se baja el PNG directo.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = NOMBRE_ARCHIVO;
      link.click();
      URL.revokeObjectURL(url);
      mostrarToast("Imagen descargada");
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
      <IconShare width={16} height={16} />
      <span className="resumenBtn__label">{generando ? "Generando…" : "Compartir"}</span>
    </button>
  );
}
