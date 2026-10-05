import { useCallback, useRef, useState } from "react";
import { useModalCard } from "../hooks/useModalCard";
import type { ResumenDatos } from "../lib/resumenImagen";
import { IconShare } from "./icons";
import ResumenDialog from "./ResumenDialog";

interface Props {
  datos: ResumenDatos;
  /** Sin al menos el oficial, la imagen saldría casi vacía */
  disabled: boolean;
}

// Comparable a lo que ya circula como "el dólar hoy" en WhatsApp/Twitter, pero
// generado en el momento con los datos reales de la app en vez de ser una
// captura de pantalla recortada a mano. Abre una hoja con la vista previa.
export default function CompartirResumenButton({ datos, disabled }: Props) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);

  const cerrar = useCallback(() => {
    setAbierto(false);
    boton.current?.focus();
  }, []);

  // Acá y no en el diálogo: así Escape, el bloqueo de scroll y el botón atrás
  // del celular dependen de `abierto`, no de que el diálogo se monte.
  useModalCard(abierto, cerrar);

  return (
    <>
      <button
        ref={boton}
        className="resumenBtn"
        onClick={() => setAbierto(true)}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        title="Compartir el resumen del día como imagen"
      >
        <IconShare width={16} height={16} />
        <span className="resumenBtn__label">Compartir</span>
      </button>
      {abierto && <ResumenDialog datos={datos} onClose={cerrar} />}
    </>
  );
}
