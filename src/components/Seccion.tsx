import type { ReactNode } from "react";

// Sección con título y grilla de tarjetas; antes el mismo <section>/<h2>/grid
// estaba repetido a mano en cada bloque de App.
export default function Seccion({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="quoteSection">
      <h2 className="sectionTitle">
        <span>{title}</span>
      </h2>
      <div className="grid">{children}</div>
    </section>
  );
}
