import { describe, expect, it } from "vitest";
import type { Cotizacion } from "../types";
import { prepararResumen } from "./resumenImagen";

function cotizacion(compra: number, venta: number): { data: Cotizacion } {
  return {
    data: {
      moneda: "USD",
      casa: "x",
      nombre: "x",
      compra,
      venta,
      fechaActualizacion: "2026-09-17T10:00:00.000Z",
    },
  };
}

describe("prepararResumen", () => {
  it("solo incluye las casas de dólar que ya tienen dato", () => {
    const resumen = prepararResumen(
      { oficial: cotizacion(1485, 1535), blue: undefined, bolsa: cotizacion(1533, 1533) },
      null
    );
    expect(resumen.dolares.map((f) => f.label)).toEqual(["Oficial", "MEP"]);
  });

  it("mantiene el orden de la sección Dólar, no el de inserción del objeto", () => {
    const resumen = prepararResumen(
      { tarjeta: cotizacion(1930, 1995), oficial: cotizacion(1485, 1535) },
      null
    );
    expect(resumen.dolares.map((f) => f.label)).toEqual(["Oficial", "Tarjeta"]);
  });

  it("sin riesgo país todavía, queda en null", () => {
    expect(prepararResumen({}, null).riesgoPais).toBeNull();
  });

  it("clasifica el riesgo país con los mismos umbrales que la tarjeta", () => {
    const resumen = prepararResumen({}, { valor: 700, fecha: "2026-09-16" });
    expect(resumen.riesgoPais).toEqual({ valor: 700, label: "Moderado" });
  });
});
