import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InfoFicha } from "./InfoFicha";

describe("InfoFicha", () => {
  it("siempre muestra la fuente; el resto de las filas es opcional", () => {
    const soloFuente = renderToStaticMarkup(<InfoFicha fuente="DolarAPI" />);
    expect(soloFuente).toContain("Fuente");
    expect(soloFuente).toContain("DolarAPI");
    expect(soloFuente).not.toContain("Par");
    expect(soloFuente).not.toContain("Subyacente");
    expect(soloFuente).not.toContain("Moneda");
  });

  it("muestra par, subyacente y moneda cuando se pasan, con la etiqueta de referencia pedida", () => {
    const html = renderToStaticMarkup(
      <InfoFicha
        fuente="Binance"
        referencia="PAXG/USDT"
        subyacente="Oro (onza troy)"
        moneda="USD"
      />
    );
    expect(html).toContain("Par");
    expect(html).toContain("PAXG/USDT");
    expect(html).toContain("Oro (onza troy)");
    expect(html).toContain("USD");
  });

  it("acepta una etiqueta de referencia distinta de 'Par' (por ejemplo, para ETF)", () => {
    const html = renderToStaticMarkup(
      <InfoFicha fuente="Twelve Data" referencia="SPY" referenciaLabel="Ticker" />
    );
    expect(html).toContain("Ticker");
    expect(html).toContain("SPY");
    expect(html).not.toContain(">Par<");
  });
});
