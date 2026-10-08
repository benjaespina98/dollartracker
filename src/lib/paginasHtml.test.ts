import { describe, expect, it } from "vitest";
import { CRIPTO, GRANOS, MERCADOS, CURRENCY_SECTIONS } from "../config/cards";
import { PAGINAS, SITIO, paginaPorRuta } from "../config/paginas";
import indexHtml from "../../index.html?raw";
import { generarSitemap, renderizarPagina, urlDePagina } from "./paginasHtml";

// El index.html real: si alguien cambia o saca una etiqueta de las que se
// reemplazan por página, el build se rompería, y esta prueba avisa antes.


describe("páginas por cotización", () => {
  it("tienen rutas únicas y sin caracteres raros", () => {
    const slugs = PAGINAS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("cada una apunta a una tarjeta que existe", () => {
    const claves = new Set([
      "riesgoPais",
      ...CURRENCY_SECTIONS.flatMap((s) => s.cards.map((c) => c.key)),
      ...[...MERCADOS, ...GRANOS, ...CRIPTO].map((m) => m.key),
    ]);
    for (const pagina of PAGINAS) expect(claves, pagina.slug).toContain(pagina.clave);
  });

  it("tienen título y descripción de un largo que Google no corta", () => {
    for (const p of PAGINAS) {
      expect(p.titulo.length, p.slug).toBeLessThanOrEqual(65);
      expect(p.descripcion.length, p.slug).toBeLessThanOrEqual(165);
      expect(p.parrafos.length, p.slug).toBeGreaterThan(0);
    }
  });

  it("encuentra la página por la ruta, con o sin barras", () => {
    expect(paginaPorRuta("/dolar-blue")?.clave).toBe("blue");
    expect(paginaPorRuta("/dolar-blue/")?.clave).toBe("blue");
    expect(paginaPorRuta("/")).toBeNull();
    expect(paginaPorRuta("/no-existe")).toBeNull();
  });
});

describe("renderizarPagina", () => {
  const blue = PAGINAS.find((p) => p.slug === "dolar-blue")!;
  const html = renderizarPagina(indexHtml, blue);

  it("cambia el título, la descripción y la dirección", () => {
    expect(html).toContain(`<title>${blue.titulo}</title>`);
    expect(html).toContain(`<link rel="canonical" href="${SITIO}/dolar-blue" />`);
    expect(html).toContain(`<meta property="og:url" content="${SITIO}/dolar-blue" />`);
    expect(html).toContain(`<meta name="description" content="${blue.descripcion}" />`);
    expect(html).toContain(`<meta property="og:title" content="${blue.titulo}" />`);
    expect(html).toContain(`<meta name="twitter:title" content="${blue.titulo}" />`);
  });

  it("no deja rastros del título de la home", () => {
    expect(html).not.toContain("<title>DollarTracker — Cotizaciones del dólar, euro y real en Argentina</title>");
    expect(html).not.toContain('rel="canonical" href="https://dollartracker.vercel.app/"');
  });

  it("incluye el texto y los enlaces para quien no ejecuta JavaScript", () => {
    expect(html).toContain(`<h1>${blue.h1}</h1>`);
    expect(html).toContain('<a href="/dolar-mep">Dólar MEP</a>');
    expect(html).toContain('<a href="/">Todas las cotizaciones</a>');
  });

  it("conserva el script del tema tal cual, porque la CSP lo permite por su hash", () => {
    const script = (h: string) => h.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script(html)).toBe(script(indexHtml.replace(/\r\n/g, "\n")));
  });

  it("escapa los caracteres especiales del texto", () => {
    const rara = { ...blue, titulo: 'A & B <script> "x"', h1: "<b>", parrafos: ["a < b"] };
    const salida = renderizarPagina(indexHtml, rara);
    expect(salida).toContain("A &amp; B &lt;script&gt; &quot;x&quot;");
    expect(salida).not.toContain("<h1><b></h1>");
  });

  it("falla con un mensaje claro si falta una etiqueta que reemplazar", () => {
    expect(() => renderizarPagina("<html></html>", blue)).toThrow(/<title>/);
  });
});

describe("generarSitemap", () => {
  it("lista la home y todas las páginas", () => {
    const xml = generarSitemap();
    expect(xml).toContain(`<loc>${SITIO}/</loc>`);
    for (const p of PAGINAS) expect(xml).toContain(`<loc>${urlDePagina(p)}</loc>`);
    expect(xml.match(/<url>/g)).toHaveLength(PAGINAS.length + 1);
  });
});
