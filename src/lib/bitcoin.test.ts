import { describe, expect, it } from "vitest";
import { aCotizacionBitcoin, aSerieBitcoin, esTicker24h } from "./bitcoin";

const ticker = {
  openPrice: "100000.00",
  lastPrice: "102500.50",
  priceChange: "2500.50",
  priceChangePercent: "2.501",
  closeTime: 1_790_000_000_000,
};

describe("bitcoin", () => {
  it("reconoce una respuesta válida de Binance y rechaza una rota", () => {
    expect(esTicker24h(ticker)).toBe(true);
    expect(esTicker24h({ ...ticker, lastPrice: "no es un número" })).toBe(false);
    expect(esTicker24h({ ...ticker, closeTime: undefined })).toBe(false);
    expect(esTicker24h(null)).toBe(false);
    expect(esTicker24h([])).toBe(false);
  });

  it("convierte el ticker a la forma de las tarjetas de mercado", () => {
    expect(aCotizacionBitcoin(ticker)).toEqual({
      symbol: "BTCUSDT",
      currency: "USD",
      price: 102500.5,
      previousClose: 100000,
      change: 2500.5,
      changePercent: 2.501,
      marketTime: 1_790_000_000, // segundos, no milisegundos
    });
  });

  it("arma la serie diaria con el cierre de cada vela y descarta velas inválidas", () => {
    const dia1 = Date.UTC(2026, 9, 1);
    const dia2 = Date.UTC(2026, 9, 2);
    const serie = aSerieBitcoin([
      [dia1, "1", "2", "0.5", "101.5", "10"],
      ["basura"],
      [dia2, "1", "2", "0.5", "x", "10"],
      [dia2, "1", "2", "0.5", "103", "10"],
    ]);
    expect(serie).toEqual([
      { fecha: "2026-10-01", valor: 101.5 },
      { fecha: "2026-10-02", valor: 103 },
    ]);
  });
});
