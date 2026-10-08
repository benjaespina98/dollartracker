import type { ReactNode } from "react";
import { useArrastrarParaOrdenar } from "../hooks/useArrastrarParaOrdenar";

interface Props {
  /** Solo en celular: arrastrar la tarjeta reordena la lista. En web quedan las flechas. */
  arrastrable: boolean;
  onMover: (direccion: -1 | 1) => void;
  children: ReactNode;
}

// Un lugar de la lista de Fijados. Es un componente propio porque el gesto usa
// un hook, y los hooks no pueden llamarse dentro del map de la lista.
export default function FijadoSlot({ arrastrable, onMover, children }: Props) {
  const { ref, desplazamiento, arrastrando } = useArrastrarParaOrdenar(arrastrable, onMover);

  return (
    <div
      ref={ref}
      className={`favSlot ${arrastrando ? "favSlot--arrastrando" : ""}`}
      style={{ translate: `0 ${desplazamiento}px`, transition: arrastrando ? "none" : "translate 0.2s ease-out" }}
    >
      {children}
    </div>
  );
}
