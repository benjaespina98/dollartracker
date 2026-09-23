import type { ReactNode, Ref } from "react";

// Piezas compartidas por las tarjetas expandibles (QuoteCard, MarketCard,
// RiesgoPaisCard): el fondo oscurecido detrás de la tarjeta centrada, su
// botón de cierre y el botón/panel de "qué estoy viendo". Viven acá para no
// triplicar el mismo SVG tres veces.

interface BackdropProps {
  onClose: () => void;
}

export function CardBackdrop({ onClose }: BackdropProps) {
  // El aviso hace visible que el fondo cierra: sin él, la única salida que se
  // veía era la X. Va en el fondo (no en el popup) porque es lo que se toca.
  return (
    <div className="cardBackdrop" onClick={onClose} aria-hidden="true">
      <span className="cardBackdrop__hint">Tocá afuera para cerrar</span>
    </div>
  );
}

interface CloseButtonProps {
  onClose: () => void;
  label: string;
  /** Al abrirse la tarjeta el foco viene acá, para no perderlo fuera del modal */
  ref?: Ref<HTMLButtonElement>;
}

export function CardCloseButton({ onClose, label, ref }: CloseButtonProps) {
  return (
    <button
      ref={ref}
      className="closeBtn"
      onClick={onClose}
      type="button"
      aria-label={label}
      title="Cerrar"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          d="M6 6l12 12M18 6 6 18"
        />
      </svg>
    </button>
  );
}

interface InfoButtonProps {
  activo: boolean;
  onToggle: () => void;
  label: string;
}

// Botón (i): explica qué se está mirando sin depender de un title, que en
// celular no se puede tocar para leerlo.
export function CardInfoButton({ activo, onToggle, label }: InfoButtonProps) {
  return (
    <button
      className={`infoBtn ${activo ? "infoBtn--activo" : ""}`}
      onClick={onToggle}
      type="button"
      aria-label={label}
      aria-pressed={activo}
      title="¿Qué estoy viendo?"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="M12 11v5.5" />
        <circle cx="12" cy="7.75" r="1.15" fill="currentColor" />
      </svg>
    </button>
  );
}

interface FavoritoButtonProps {
  activo: boolean;
  onToggle: () => void;
  label: string;
}

// Estrella para marcar/desmarcar favorito. Vive en el header igual que el
// (i): así se puede favoritear una tarjeta sin tener que abrirla primero.
export function CardFavoritoButton({ activo, onToggle, label }: FavoritoButtonProps) {
  return (
    <button
      className={`favBtn ${activo ? "favBtn--activo" : ""}`}
      onClick={onToggle}
      type="button"
      aria-label={label}
      aria-pressed={activo}
      title={activo ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={activo ? "currentColor" : "none"} aria-hidden="true">
        <path
          d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6-4.8-4.6 6.6-.9Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

interface InfoPanelProps {
  children: ReactNode;
}

export function CardInfoPanel({ children }: InfoPanelProps) {
  return (
    <div className="infoPanel" role="note">
      {children}
    </div>
  );
}
