import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Cotizacion, MarketQuote, RiesgoPais } from "../types";
import MarketCard from "./MarketCard";
import QuoteCard from "./QuoteCard";
import RiesgoPaisCard from "./RiesgoPaisCard";

// En celular las tarjetas se reducen a una fila de lista (venta a la vista; la
// compra y el gráfico grande, al abrirla). Estas pruebas fuerzan el modo móvil.
vi.mock("../hooks/useEsMovil", () => ({ useEsMovil: () => true }));

// El histórico llega después, con una petición: acá se entrega ya cargado para el
// dólar blue (con él la fila se puede abrir) y se deja vacío para el resto.
vi.mock("../hooks/useHistorico", async (original) => ({
  ...(await original<typeof import("../hooks/useHistorico")>()),
  useHistoricoDolar: (casa: string) =>
    casa === "blue"
      ? [
          { fecha: "2026-08-01", valor: 1500 },
          { fecha: "2026-08-02", valor: 1520 },
        ]
      : null,
}));

const cotizacion: Cotizacion = {
  moneda: "USD",
  casa: "blue",
  nombre: "Dólar blue",
  compra: 1505,
  venta: 1525,
  fechaActualizacion: "2026-08-24T14:30:00.000Z",
};

const quote = (props: Partial<Parameters<typeof QuoteCard>[0]> = {}) =>
  renderToStaticMarkup(
    <QuoteCard
      casa="blue"
      label="Blue"
      nombre="Dólar blue"
      icon={null}
      accent="#78beff"
      data={cotizacion}
      status="ready"
      savedAt={null}
      monto={null}
      origen="ARS"
      favorito={false}
      onToggleFavorito={() => {}}
      {...props}
    />
  );

describe("QuoteCard en celular", () => {
  it("es una fila que muestra la venta y no el bloque de compra/venta", () => {
    const html = quote({ brecha: 12.3 });
    expect(html).toContain("quoteRow");
    expect(html).toContain("quoteCard--fila");
    expect(html).toContain("1.525,00"); // venta
    expect(html).not.toContain("quotePriceLabel"); // sin el bloque de compra y venta
    expect(html).not.toContain("quoteHeader"); // sin los botones de la tarjeta completa
  });

  it("muestra la brecha como línea de detalle cuando la tiene", () => {
    expect(quote({ brecha: 12.3 })).toContain("Brecha +12.3%");
  });

  it("sin histórico (euro, real) la compra va en la fila, porque no hay popup para verla", () => {
    const html = quote({ casa: "eur_oficial", label: "Euro", nombre: "Euro oficial" });
    expect(html).toContain("Compra");
    expect(html).toContain("1.505,00");
    expect(html).not.toContain("<button"); // no se abre: no es un botón
  });

  it("con histórico la fila es un botón que abre el detalle", () => {
    const html = quote();
    expect(html).toContain('<button type="button" class="quoteRow quoteRow--abrible"');
  });

  it("en modo conversión muestra el resultado en la fila", () => {
    const html = quote({ monto: 100000, origen: "ARS" });
    expect(html).toContain("US$");
    expect(html).toContain("(venta)");
  });

  it("avisa cuando no hay dato y mientras carga", () => {
    expect(quote({ data: null, status: "error" })).toContain("Sin dato");
    expect(quote({ data: null, status: "loading" })).toContain("quoteRow__skeleton");
  });

  it("con copia local vieja muestra el aviso de sin conexión en la fila", () => {
    const html = quote({ status: "stale", savedAt: Date.now() - 60_000 });
    expect(html).toContain("Sin conexión");
  });
});

describe("MarketCard y RiesgoPaisCard en celular", () => {
  const market: MarketQuote = {
    symbol: "GLD",
    currency: "USD",
    price: 250.5,
    previousClose: 248,
    change: 2.5,
    changePercent: 1.08,
    marketTime: 1_786_000_000,
  };

  it("el mercado muestra el precio, su ticker y la variación", () => {
    const html = renderToStaticMarkup(
      <MarketCard
        label="Oro"
        icon={null}
        ticker="GLD"
        detalle="Sigue al oro spot"
        accent="#eab308"
        data={market}
        status="ready"
        savedAt={null}
        historico={null}
        favorito={false}
        onToggleFavorito={() => {}}
      />
    );
    expect(html).toContain("quoteRow");
    expect(html).toContain("250,50");
    expect(html).toContain("GLD");
    expect(html).toContain("quoteVariation up");
  });

  it("el riesgo país muestra el valor en puntos básicos y su categoría", () => {
    const data: RiesgoPais = { valor: 573, fecha: "2026-10-06" };
    const html = renderToStaticMarkup(
      <RiesgoPaisCard
        icon={null}
        accent="#f87171"
        data={data}
        status="ready"
        savedAt={null}
        favorito={false}
        onToggleFavorito={() => {}}
      />
    );
    expect(html).toContain("quoteRow");
    expect(html).toContain("573 pb");
    expect(html).toContain("Moderado");
  });
});
