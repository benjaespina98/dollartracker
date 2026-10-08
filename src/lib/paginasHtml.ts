import { PAGINAS, SITIO, type PaginaMoneda } from "../config/paginas";

// Genera, a partir del index.html que arma Vite, una copia por página con su
// título, descripción y dirección propios, más un texto que el buscador lee
// aunque no ejecute JavaScript. Lo usa el build (vite.config.ts); está acá, y
// no en la config, para poder probarlo.

const escapar = (texto: string) =>
  texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function reemplazar(html: string, patron: RegExp, nuevo: string, nombre: string): string {
  if (!patron.test(html)) throw new Error(`index.html no tiene ${nombre}: no se puede armar la página`);
  return html.replace(patron, nuevo);
}

export const urlDePagina = (pagina: PaginaMoneda) => `${SITIO}/${pagina.slug}`;

export function renderizarPagina(html: string, pagina: PaginaMoneda, todas: PaginaMoneda[] = PAGINAS): string {
  const url = urlDePagina(pagina);
  const titulo = escapar(pagina.titulo);
  const descripcion = escapar(pagina.descripcion);

  let salida = html.replace(/\r\n/g, "\n");
  salida = reemplazar(salida, /<title>[^<]*<\/title>/, `<title>${titulo}</title>`, "<title>");
  salida = reemplazar(salida, /(<meta name="description" content=")[^"]*(")/, `$1${descripcion}$2`, "meta description");
  salida = reemplazar(salida, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, "canonical");
  salida = reemplazar(salida, /(<meta property="og:title" content=")[^"]*(")/, `$1${titulo}$2`, "og:title");
  salida = reemplazar(salida, /(<meta property="og:description" content=")[^"]*(")/, `$1${descripcion}$2`, "og:description");
  salida = reemplazar(salida, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, "og:url");
  salida = reemplazar(salida, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${titulo}$2`, "twitter:title");
  salida = reemplazar(salida, /(<meta name="twitter:description" content=")[^"]*(")/, `$1${descripcion}$2`, "twitter:description");

  // Texto para quien no ejecuta JavaScript. React lo reemplaza apenas arranca
  // (createRoot vacía el contenedor); mientras tanto no se ve, para que no
  // parpadee sin estilos.
  const enlaces = todas
    .map((p) => `<li><a href="/${p.slug}">${escapar(p.nombre)}</a></li>`)
    .join("");
  const fallback =
    `<div style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)">` +
    `<h1>${escapar(pagina.h1)}</h1>` +
    pagina.parrafos.map((p) => `<p>${escapar(p)}</p>`).join("") +
    `<nav><ul><li><a href="/">Todas las cotizaciones</a></li>${enlaces}</ul></nav></div>`;
  salida = reemplazar(salida, /<div id="root"><\/div>/, `<div id="root">${fallback}</div>`, 'contenedor <div id="root">');

  return salida;
}

export function generarSitemap(paginas: PaginaMoneda[] = PAGINAS): string {
  const entrada = (ruta: string, frecuencia: string, prioridad: string) =>
    `  <url>\n    <loc>${SITIO}${ruta}</loc>\n    <changefreq>${frecuencia}</changefreq>\n    <priority>${prioridad}</priority>\n  </url>`;
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [entrada("/", "hourly", "1.0"), ...paginas.map((p) => entrada(`/${p.slug}`, "hourly", "0.8"))].join("\n") +
    `\n</urlset>\n`
  );
}
