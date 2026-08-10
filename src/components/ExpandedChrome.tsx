import type { ReactNode } from "react";

// Piezas compartidas por las tarjetas expandibles (QuoteCard, MarketCard,
// RiesgoPaisCard): el fondo oscurecido detrás de la tarjeta centrada, su
// botón de cierre y el botón/panel de "qué estoy viendo". Viven acá para no
// triplicar el mismo SVG tres veces.

interface BackdropProps {
  onClose: () => void;
}

export function CardBackdrop({ onClose }: BackdropProps) {
  return <div className="cardBackdrop" onClick={onClose} aria-hidden="true" />;
}

interface CloseButtonProps {
  onClose: () => void;
  label: string;
}

export function CardCloseButton({ onClose, label }: CloseButtonProps) {
  return (
    <button
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
