import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Cotizacion, MarketQuote, RiesgoPais } from "../types";
import MarketCard from "./MarketCard";
import QuoteCard from "./QuoteCard";
import RiesgoPaisCard from "./RiesgoPaisCard";
import { Variacion } from "./CardMeta";

// Las tarjetas no tenían ninguna prueba: los tres archivos repetían la misma
// lógica y cada arreglo se aplicaba (o se olvidaba) tres veces. Ahora comparten
// CardShell, así que alcanza con verificar lo que cada una aporta.

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
      monto={null}
      origen="ARS"
      {...props}
    />
  );

describe("QuoteCard", () => {
  it("muestra compra y venta cuando no hay monto tipeado", () => {
    const html = quote();
    expect(html).toContain("Compra");
    expect(html).toContain("Venta");
    expect(html).toContain("1.505,00");
    expect(html).toContain("1.525,00");
  });

  it("cambia a modo conversión cuando hay monto, usando la punta de venta", () => {
    const html = quote({ monto: 20000, origen: "ARS" });
    expect(html).not.toContain("Compra");
    // 20000 / 1525 = 13,11 dólares
    expect(html).toContain("13,11");
    expect(html).toContain("(venta)");
  });

  it("sigue mostrando compra y venta si la tarjeta no aplica al origen elegido", () => {
    // Monto en euros sobre una tarjeta de dólar: no se inventa una tasa cruzada
    const html = quote({ monto: 100, origen: "EUR" });
    expect(html).toContain("Compra");
  });

  it("no muestra variación sin cierre anterior con el que comparar", () => {
    // El histórico se carga en un efecto, así que en este render todavía no
    // está: antes acá salía un "0,00%" comparando contra el valor de hace
    // cinco minutos, con la leyenda "vs. cierre ayer".
    expect(quote()).not.toContain("quoteVariation");
  });

  it("no ofrece compartir ni abrir el histórico mientras no hay datos", () => {
    const html = quote({ data: null, status: "error" });
    expect(html).toContain("No se pudo obtener el dato");
    expect(html).not.toContain("shareBtn");
    expect(html).not.toContain("quoteBody--expandible");
  });
});

const market: MarketQuote = {
  symbol: "GLD",
  currency: "USD",
  price: 312.45,
  previousClose: 309.1,
  change: 3.35,
  changePercent: 1.084,
  marketTime: 1_756_051_200,
};

describe("MarketCard", () => {
  const render = (props: Partial<Parameters<typeof MarketCard>[0]> = {}) =>
    renderToStaticMarkup(
      <MarketCard
        label="Oro"
        icon={null}
        ticker="GLD"
        detalle="Sigue al oro spot"
        accent="#eab308"
        data={market}
        status="ready"
        historico={null}
        {...props}
      />
    );

  it("muestra el precio y el ticker del ETF, no la explicación completa", () => {
    const html = render();
    expect(html).toContain("312,45");
    expect(html).toContain(">GLD<");
    // El "sigue al oro spot" ahora vive en el panel (i) y en el title
    expect(html).not.toContain(">Sigue al oro spot<");
  });

  it("pinta de verde una variación positiva", () => {
    expect(render()).toContain("quoteVariation up");
    expect(render()).toContain("1.08%");
  });

  it("avisa cuando el dato es una copia local vieja", () => {
    const html = render({ status: "stale" });
    expect(html).toContain("Sin conexión");
    expect(html).not.toContain("quoteVariation");
  });
});

describe("RiesgoPaisCard", () => {
  const render = (data: RiesgoPais) =>
    renderToStaticMarkup(
      <RiesgoPaisCard icon={null} accent="#ef4444" data={data} status="ready" />
    );

  it("clasifica el valor según los umbrales de mercado", () => {
    expect(render({ valor: 350, fecha: "2026-08-22" })).toContain("riesgoTag--low");
    expect(render({ valor: 700, fecha: "2026-08-22" })).toContain("riesgoTag--medium");
    expect(render({ valor: 1200, fecha: "2026-08-22" })).toContain("riesgoTag--high");
    expect(render({ valor: 1800, fecha: "2026-08-22" })).toContain("riesgoTag--critical");
  });

  it("muestra el valor en puntos básicos", () => {
    const html = render({ valor: 1234, fecha: "2026-08-22" });
    expect(html).toContain("1.234");
    expect(html).toContain("pb");
  });
});

describe("Variacion", () => {
  it("usa un umbral para no pintar de color un redondeo a cero", () => {
    const render = (valor: number) =>
      renderToStaticMarkup(<Variacion valor={valor} texto="0,00%" title="" />);

    expect(render(0.0005)).toContain("quoteVariation flat");
    expect(render(-0.0005)).toContain("quoteVariation flat");
    expect(render(0.5)).toContain("quoteVariation up");
    expect(render(-0.5)).toContain("quoteVariation down");
  });
});
