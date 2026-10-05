import type { ReactNode } from "react";

interface Props {
  title: string;
  /** Acción propia de la sección (por ejemplo compartir), a la derecha del título */
  action?: ReactNode;
  children: ReactNode;
}

// Sección con título y grilla de tarjetas; antes el mismo <section>/<h2>/grid
// estaba repetido a mano en cada bloque de App.
export default function Seccion({ title, action, children }: Props) {
  return (
    <section className="quoteSection">
      <div className="sectionHead">
        <h2 className="sectionTitle">
          <span>{title}</span>
        </h2>
        {action}
      </div>
      <div className="grid">{children}</div>
    </section>
  );
}
