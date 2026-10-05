import { useEffect, useRef, useState } from "react";
import { suscribirToast } from "../lib/toast";

const DURACION_MS = 2200;

// Un solo cartel para toda la app, anunciado a lectores de pantalla.
export default function Toaster() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const baja = suscribirToast((texto) => {
      setMensaje(texto);
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setMensaje(null), DURACION_MS);
    });
    return () => {
      baja();
      clearTimeout(timeout.current);
    };
  }, []);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {mensaje && <span className="toast">{mensaje}</span>}
    </div>
  );
}
