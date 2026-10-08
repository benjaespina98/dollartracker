import { describe, expect, it } from "vitest";
import { pasosCruzados } from "./useArrastrarParaOrdenar";

describe("pasosCruzados", () => {
  it("no cuenta un movimiento menor a una tarjeta", () => {
    expect(pasosCruzados(40, 100)).toBe(0);
    expect(pasosCruzados(-99, 100)).toBe(0);
  });

  it("cuenta cada tarjeta completa cruzada, en ambos sentidos", () => {
    expect(pasosCruzados(250, 100)).toBe(2);
    expect(pasosCruzados(-250, 100)).toBe(-2);
  });

  it("sin tarjeta vecina (paso 0) no mueve nada", () => {
    expect(pasosCruzados(300, 0)).toBe(0);
  });
});
