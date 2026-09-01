import { describe, expect, it } from "vitest";
import { convertir, formatearMoneda, formatearMontoTipeado, parsearMonto } from "./conversion";

// Intl separa el símbolo del número con espacio duro para que no se corten en
// dos líneas. Si se compara contra un espacio común, los strings se ven
// idénticos y el test falla sin motivo aparente.
const NBSP = " ";

describe("parsearMonto", () => {
  it("entiende el formato argentino", () => {
    expect(parsearMonto("50.000")).toBe(50000);
    expect(parsearMonto("1.234,56")).toBe(1234.56);
    expect(parsearMonto("50000")).toBe(50000);
  });

  it("tolera que peguen el símbolo", () => {
    expect(parsearMonto("$ 50.000")).toBe(50000);
    expect(parsearMonto("US$ 1.500")).toBe(1500);
  });

  it("descarta lo que no es un monto usable", () => {
    expect(parsearMonto("")).toBeNull();
    expect(parsearMonto("abc")).toBeNull();
    expect(parsearMonto("0")).toBeNull();
  });
});

describe("convertir", () => {
  // Cotizaciones de ejemplo: la casa compra a 1505 y vende a 1525
  const compra = 1505;
  const venta = 1525;

  it("de pesos a moneda extranjera paga el precio de VENTA", () => {
    // Comprás dólares: te los vende la casa, así que pagás el precio más alto.
    // Si esto se rompe y usa compra, el resultado sigue siendo un número
    // plausible en pantalla y nadie lo nota.
    expect(convertir(20000, "ARS", "USD", compra, venta)).toEqual({
      valor: 20000 / venta,
      moneda: "USD",
      tasa: venta,
      punta: "venta",
    });
  });

  it("de moneda extranjera a pesos cobra el precio de COMPRA", () => {
    expect(convertir(100, "USD", "USD", compra, venta)).toEqual({
      valor: 150500,
      moneda: "ARS",
      tasa: compra,
      punta: "compra",
    });
  });

  it("responde en todas las monedas cuando el origen es pesos", () => {
    expect(convertir(20000, "ARS", "EUR", 1740, 1790)?.moneda).toBe("EUR");
    expect(convertir(20000, "ARS", "BRL", 265, 285)?.moneda).toBe("BRL");
  });

  it("no inventa tasas cruzadas", () => {
    // Escribiste euros y esta es una tarjeta de dólar: habría que elegir
    // arbitrariamente un dólar puente y pagar dos spreads.
    expect(convertir(100, "EUR", "USD", compra, venta)).toBeNull();
    expect(convertir(100, "BRL", "USD", compra, venta)).toBeNull();
    expect(convertir(100, "USD", "EUR", 1740, 1790)).toBeNull();
  });

  it("no divide por cero si la cotización viene en cero", () => {
    expect(convertir(20000, "ARS", "USD", 0, 0)).toBeNull();
    expect(convertir(100, "USD", "USD", 0, venta)).toBeNull();
  });
});

describe("formatearMoneda", () => {
  it("usa US$ para el dólar y no un $ pelado", () => {
    // narrowSymbol daría "$", que se confunde con pesos
    expect(formatearMoneda(32.79, "USD")).toBe(`US$${NBSP}32,79`);
  });

  it("usa los símbolos cortos del euro y el real", () => {
    expect(formatearMoneda(28.5, "EUR")).toBe(`€${NBSP}28,50`);
    expect(formatearMoneda(120.4, "BRL")).toBe(`R$${NBSP}120,40`);
  });

  it("formatea pesos con separador de miles", () => {
    expect(formatearMoneda(75250, "ARS")).toBe(`$${NBSP}75.250,00`);
  });
});

describe("formatearMontoTipeado", () => {
  it("agrega los separadores al salir del campo", () => {
    expect(formatearMontoTipeado("250000")).toBe("250.000");
    expect(formatearMontoTipeado("1234,5")).toBe("1.234,5");
  });

  it("es idempotente y reversible", () => {
    expect(formatearMontoTipeado("250.000")).toBe("250.000");
    expect(parsearMonto(formatearMontoTipeado("250000"))).toBe(250000);
  });

  it("deja intacto lo que no puede parsear", () => {
    expect(formatearMontoTipeado("abc")).toBe("abc");
    expect(formatearMontoTipeado("")).toBe("");
  });
});
