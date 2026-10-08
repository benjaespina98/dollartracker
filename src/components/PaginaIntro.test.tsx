import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PAGINAS } from "../config/paginas";
import PaginaIntro from "./PaginaIntro";

const blue = PAGINAS.find((p) => p.slug === "dolar-blue")!;

describe("PaginaIntro", () => {
  const html = renderToStaticMarkup(
    <PaginaIntro
      pagina={blue}
      accent="#78beff"
      valores={[
        { etiqueta: "Compra", texto: "$ 1.535,00" },
        { etiqueta: "Venta", texto: "$ 1.555,00", destacado: true },
      ]}
    />
  );

  it("muestra el título, el texto y las cifras del momento", () => {
    expect(html).toContain(`<h1 class="paginaIntro__titulo">${blue.h1}</h1>`);
    expect(html).toContain("$ 1.535,00");
    expect(html).toContain("paginaIntro__valor--destacado");
  });

  it("enlaza a todas las demás páginas, menos a la actual", () => {
    expect(html).toContain('href="/dolar-mep"');
    expect(html).not.toContain('href="/dolar-blue"');
    expect((html.match(/paginaIntro__chip/g) ?? []).length).toBe(PAGINAS.length - 1);
  });

  it("sin cifras (mientras carga) no dibuja el bloque de valores", () => {
    const sinDatos = renderToStaticMarkup(<PaginaIntro pagina={blue} accent="#78beff" valores={[]} />);
    expect(sinDatos).not.toContain("paginaIntro__valores");
  });
});
