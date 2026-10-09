import type { CSSProperties, ReactNode } from "react";
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

  // Solo se aplica translate mientras se arrastra. En reposo no puede haber
  // ninguno, ni siquiera "0px": cualquier translate/transform en un contenedor
  // lo vuelve la referencia del popup (position: fixed) de la tarjeta de
  // adentro, que quedaba descentrado y tapado por las demás tarjetas.
  const estilo: CSSProperties | undefined = arrastrando
    ? { translate: `0 ${desplazamiento}px`, transition: "none" }
    : undefined;

  return (
    <div ref={ref} className={`favSlot ${arrastrando ? "favSlot--arrastrando" : ""}`} style={estilo}>
      {children}
    </div>
  );
}
