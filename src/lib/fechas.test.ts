import { afterEach, describe, expect, it, vi } from "vitest";
import { cierreAnterior, hoyEnArgentina } from "./fechas";

const serie = [
  { fecha: "2026-08-06", valor: 1500 },
  { fecha: "2026-08-07", valor: 1510 },
  { fecha: "2026-08-08", valor: 1520 },
];

afterEach(() => {
  vi.useRealTimers();
});

describe("hoyEnArgentina", () => {
  it("devuelve el día argentino, no el UTC", () => {
    // 23:30 del 10/8 en Argentina ya es el 11/8 en UTC. Con toISOString() la
    // app pasaba a creer que era el día siguiente y la variación se iba a cero.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-11T02:30:00Z"));
    expect(new Date().toISOString().slice(0, 10)).toBe("2026-08-11");
    expect(hoyEnArgentina()).toBe("2026-08-10");
  });

  it("coincide con UTC durante el día", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T15:00:00Z"));
    expect(hoyEnArgentina()).toBe("2026-08-10");
  });

  it("tiene formato YYYY-MM-DD para poder comparar contra las series", () => {
    expect(hoyEnArgentina()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("cierreAnterior", () => {
  it("toma el último punto previo a hoy", () => {
    expect(cierreAnterior(serie, "2026-08-10")?.valor).toBe(1520);
  });

  it("si la serie ya trae el día de hoy, usa el anterior", () => {
    expect(cierreAnterior(serie, "2026-08-08")?.valor).toBe(1510);
  });

  it("devuelve null si no hay ningún cierre previo", () => {
    expect(cierreAnterior(serie, "2026-08-01")).toBeNull();
    expect(cierreAnterior(null, "2026-08-10")).toBeNull();
    expect(cierreAnterior([], "2026-08-10")).toBeNull();
  });

  it("da la variación diaria esperada", () => {
    const previo = cierreAnterior(serie, "2026-08-10")!.valor;
    const variacion = ((1550 - previo) / previo) * 100;
    expect(variacion).toBeCloseTo(1.9737, 4);
  });
});
