import { describe, expect, it } from "vitest";
import { UMBRAL_ACCION_PX, confirmaAccion } from "./useSwipeAccion";

describe("confirmaAccion", () => {
  it("un temblor no fija ni desfija la tarjeta", () => {
    expect(confirmaAccion(0)).toBe(false);
    expect(confirmaAccion(UMBRAL_ACCION_PX - 1)).toBe(false);
  });

  it("confirma desde el umbral en adelante", () => {
    expect(confirmaAccion(UMBRAL_ACCION_PX)).toBe(true);
    expect(confirmaAccion(250)).toBe(true);
  });
});
