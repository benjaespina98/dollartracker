import type { CSSProperties } from "react";
import { PAGINAS, type PaginaMoneda } from "../config/paginas";

export interface ValorDePagina {
  etiqueta: string;
  texto: string;
  /** El valor principal (por ejemplo la venta) va con el color de la tarjeta */
  destacado?: boolean;
}

interface Props {
  pagina: PaginaMoneda;
  /** Color de la tarjeta que ilustra la página */
  accent: string;
  /** Cotización del momento ya formateada; vacío mientras carga */
  valores: ValorDePagina[];
}

const fechaDeHoy = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  weekday: "long",
  day: "numeric",
  month: "long",
});

// Encabezado de las páginas por cotización (/dolar-blue…): fecha, título,
// cifras del momento, un texto breve y enlaces a las demás cotizaciones. El
// texto es lo mismo que lee el buscador en el HTML de la página; la home no
// lo muestra.
export default function PaginaIntro({ pagina, accent, valores }: Props) {
  return (
    <section className="paginaIntro" style={{ "--accent": accent } as CSSProperties}>
      <div className="paginaIntro__cabecera">
        <p className="paginaIntro__fecha">{fechaDeHoy.format(new Date())}</p>
        <h1 className="paginaIntro__titulo">{pagina.h1}</h1>
      </div>

      {valores.length > 0 && (
        <div className="paginaIntro__valores">
          {valores.map((v) => (
            <div key={v.etiqueta} className={`paginaIntro__valor ${v.destacado ? "paginaIntro__valor--destacado" : ""}`}>
              <span className="paginaIntro__etiqueta">{v.etiqueta}</span>
              <span className="paginaIntro__numero">{v.texto}</span>
            </div>
          ))}
        </div>
      )}

      <div className="paginaIntro__parrafos">
        {pagina.parrafos.map((texto) => (
          <p key={texto} className="paginaIntro__parrafo">
            {texto}
          </p>
        ))}
      </div>

      <nav className="paginaIntro__otras" aria-label="Otras cotizaciones">
        {PAGINAS.filter((p) => p.slug !== pagina.slug).map((p) => (
          <a key={p.slug} className="paginaIntro__chip" href={`/${p.slug}`}>
            {p.nombre}
          </a>
        ))}
      </nav>
    </section>
  );
}
