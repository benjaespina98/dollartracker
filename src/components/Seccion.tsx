import type { ReactNode } from "react";

interface Props {
  title: string;
  /** Acciones propias de la sección (por ejemplo compartir), a la derecha del título */
  action?: ReactNode;
  /** Contenido entre el título y las tarjetas (por ejemplo el cotizador desplegado) */
  intro?: ReactNode;
  children: ReactNode;
}

// Sección con título y grilla de tarjetas; antes el mismo <section>/<h2>/grid
// estaba repetido a mano en cada bloque de App.
export default function Seccion({ title, action, intro, children }: Props) {
  return (
    <section className="quoteSection">
      <div className="sectionHead">
        <h2 className="sectionTitle">
          <span>{title}</span>
        </h2>
        {action && <div className="sectionActions">{action}</div>}
      </div>
      {intro && <div className="sectionIntro">{intro}</div>}
      <div className="grid">{children}</div>
    </section>
  );
}
