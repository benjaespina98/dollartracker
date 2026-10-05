import { useEffect, useRef, useState } from "react";
import { canvasABlob, dibujarResumen, type ResumenDatos } from "../lib/resumenImagen";
import { mostrarToast } from "../lib/toast";
import { CardCloseButton } from "./ExpandedChrome";
import { IconCopy, IconDownload, IconShare } from "./icons";

const URL_APP = "https://dollartracker.vercel.app/";
const NOMBRE_ARCHIVO = "dollartracker-resumen.png";

interface Props {
  datos: ResumenDatos;
  onClose: () => void;
}

// Hoja de compartir: se ve la imagen antes de mandarla y las salidas posibles
// están a la vista (el patrón de las apps actuales), en vez de un botón que
// disparaba el menú del sistema o bajaba un archivo sin avisar.
export default function ResumenDialog({ datos, onClose }: Props) {
  // Foto de los datos al abrir: si llega un refresco con la hoja abierta, la
  // imagen que se ve es la que se comparte.
  const [snapshot] = useState(datos);
  const [imagen, setImagen] = useState<{ blob: Blob; url: string } | null>(null);
  const [fallo, setFallo] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cerrarRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelado = false;
    let url: string | null = null;
    (async () => {
      // Sin esto el canvas puede dibujar con la tipografía de reserva del
      // sistema si Inter todavía no terminó de cargar en esta sesión.
      await document.fonts.ready;
      const blob = await canvasABlob(dibujarResumen(snapshot));
      if (cancelado) return;
      if (!blob) {
        setFallo(true);
        return;
      }
      url = URL.createObjectURL(blob);
      setImagen({ blob, url });
    })();
    return () => {
      cancelado = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [snapshot]);

  const archivo = imagen ? new File([imagen.blob], NOMBRE_ARCHIVO, { type: "image/png" }) : null;
  const puedeCompartir = !!archivo && !!navigator.canShare?.({ files: [archivo] });
  const puedeCopiar = typeof ClipboardItem !== "undefined" && !!navigator.clipboard?.write;

  async function compartir() {
    if (!archivo) return;
    try {
      // La URL va en "text": WhatsApp la muestra como link tocable, en vez de
      // una línea de texto suelta junto a la imagen.
      await navigator.share({ files: [archivo], text: URL_APP });
      onClose();
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) mostrarToast("No se pudo compartir");
    }
  }

  function descargar() {
    if (!imagen) return;
    const link = document.createElement("a");
    link.href = imagen.url;
    link.download = NOMBRE_ARCHIVO;
    link.click();
    mostrarToast("Imagen descargada");
  }

  async function copiar() {
    if (!imagen) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": imagen.blob })]);
      mostrarToast("Imagen copiada");
    } catch {
      mostrarToast("No se pudo copiar la imagen");
    }
  }

  return (
    <>
      <div className="cardBackdrop" onClick={onClose} aria-hidden="true" />
      <section className="sheet" role="dialog" aria-modal="true" aria-label="Compartir resumen del día">
        <header className="sheet__header">
          <h2 className="sheet__title">Compartir resumen</h2>
          <CardCloseButton ref={cerrarRef} onClose={onClose} label="Cerrar" />
        </header>

        <div className="sheet__preview">
          {imagen ? (
            <img src={imagen.url} alt="Vista previa del resumen del día" width={1080} height={1350} />
          ) : fallo ? (
            <p className="sheet__error">No se pudo generar la imagen</p>
          ) : (
            <div className="sheet__skeleton" aria-label="Generando imagen" />
          )}
        </div>

        <div className="sheet__actions">
          {puedeCompartir && (
            <button type="button" className="sheet__btn sheet__btn--primary" onClick={compartir}>
              <IconShare width={16} height={16} />
              Compartir
            </button>
          )}
          <button
            type="button"
            className={`sheet__btn ${puedeCompartir ? "" : "sheet__btn--primary"}`}
            onClick={descargar}
            disabled={!imagen}
          >
            <IconDownload width={16} height={16} />
            Descargar
          </button>
          {puedeCopiar && (
            <button type="button" className="sheet__btn" onClick={copiar} disabled={!imagen}>
              <IconCopy width={16} height={16} />
              Copiar
            </button>
          )}
        </div>
      </section>
    </>
  );
}
