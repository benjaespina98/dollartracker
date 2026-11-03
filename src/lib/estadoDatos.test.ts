import { describe, expect, it } from "vitest";
import { hayAlgunDatoDesactualizado } from "./estadoDatos";

describe("hayAlgunDatoDesactualizado", () => {
  it("false cuando todo está 'ready' (o todavía 'loading')", () => {
    expect(hayAlgunDatoDesactualizado(["ready", "ready", "ready"])).toBe(false);
    expect(hayAlgunDatoDesactualizado(["ready", "loading"])).toBe(false);
    expect(hayAlgunDatoDesactualizado([])).toBe(false);
  });

  it("true si al menos uno quedó 'stale' (dato guardado, no el actual)", () => {
    expect(hayAlgunDatoDesactualizado(["ready", "ready", "stale"])).toBe(true);
  });

  it("true si al menos uno quedó en 'error' (sin dato ni copia local)", () => {
    expect(hayAlgunDatoDesactualizado(["ready", "error"])).toBe(true);
  });
});
