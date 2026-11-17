import type { CSSProperties, MouseEvent } from "react";
import { PAGINAS, type PaginaMoneda } from "../config/paginas";
import { esClicDeNavegacionNormal } from "../lib/navegacion";

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
  /** Navega sin recargar el documento; sin esto, los enlaces funcionan igual
   * pero como clics normales (recargan). */
  onNavegar?: (ruta: string) => void;
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
export default function PaginaIntro({ pagina, accent, valores, onNavegar }: Props) {
  // Si no hay onNavegar (por ejemplo en los tests, que renderizan el
  // componente solo) los enlaces siguen funcionando como clics normales.
  const manejarClick = (ruta: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!onNavegar || !esClicDeNavegacionNormal(e)) return;
    e.preventDefault();
    onNavegar(ruta);
  };

  return (
    <section className="paginaIntro" style={{ "--accent": accent } as CSSProperties}>
      <div className="paginaIntro__cabecera">
        <div className="paginaIntro__cabeceraTop">
          <p className="paginaIntro__fecha">{fechaDeHoy.format(new Date())}</p>
          {/* Mismo botón que cierra las tarjetas expandidas: acá "cerrar" es
              volver a todas las cotizaciones, la salida más directa, visible
              sin tener que llegar a los enlaces del pie. */}
          <a
            className="paginaIntro__cerrar closeBtn"
            href="/"
            onClick={manejarClick("/")}
            aria-label="Cerrar y volver a todas las cotizaciones"
            title="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </a>
        </div>
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
        <a className="paginaIntro__chip paginaIntro__chip--todas" href="/" onClick={manejarClick("/")}>
          Todas las cotizaciones
        </a>
        {PAGINAS.filter((p) => p.slug !== pagina.slug).map((p) => (
          <a
            key={p.slug}
            className="paginaIntro__chip"
            href={`/${p.slug}`}
            onClick={manejarClick(`/${p.slug}`)}
          >
            {p.nombre}
          </a>
        ))}
      </nav>
    </section>
  );
}
