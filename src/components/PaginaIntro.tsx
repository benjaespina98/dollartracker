import type { PaginaMoneda } from "../config/paginas";

interface Props {
  pagina: PaginaMoneda;
  /** Cotización del momento ya formateada, o null mientras carga */
  valor: string | null;
}

// Encabezado de las páginas por cotización (/dolar-blue…): título, valor en
// vivo y un texto breve. Es lo mismo que lee el buscador en el HTML de la
// página; la home no lo muestra.
export default function PaginaIntro({ pagina, valor }: Props) {
  return (
    <section className="paginaIntro">
      <h1 className="paginaIntro__titulo">{pagina.h1}</h1>
      {valor && <p className="paginaIntro__valor">{valor}</p>}
      {pagina.parrafos.map((texto) => (
        <p key={texto} className="paginaIntro__texto">
          {texto}
        </p>
      ))}
    </section>
  );
}
