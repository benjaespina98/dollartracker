import { describe, expect, it } from "vitest";
import { recortarRango, tieneHistorico, type SeriePunto } from "./useHistorico";

function serieDeDias(cantidad: number): SeriePunto[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (cantidad - 1 - i));
    return { fecha: d.toISOString().slice(0, 10), valor: 1000 + i };
  });
}

describe("tieneHistorico", () => {
  it("marca las seis casas de dólar que sí tienen serie", () => {
    for (const casa of ["oficial", "blue", "bolsa", "contadoconliqui", "cripto", "tarjeta"]) {
      expect(tieneHistorico(casa)).toBe(true);
    }
  });

  it("excluye euro y real, que devuelven 404 en ArgentinaDatos", () => {
    expect(tieneHistorico("eur_oficial")).toBe(false);
    expect(tieneHistorico("brl_oficial")).toBe(false);
  });
});

describe("recortarRango", () => {
  const larga = serieDeDias(400);

  it("recorta a la ventana pedida", () => {
    // 7 días de corte incluyen hoy, así que son 8 puntos
    expect(recortarRango(larga, 7)).toHaveLength(8);
    expect(recortarRango(larga, 30)).toHaveLength(31);
    expect(recortarRango(larga, 365)).toHaveLength(366);
  });

  it("mantiene el orden cronológico", () => {
    const r = recortarRango(larga, 30);
    expect(r[0].fecha < r[r.length - 1].fecha).toBe(true);
  });

  it("cae al fallback cuando la ventana queda con menos de dos puntos", () => {
    // Una serie vieja (por feriados o por corte de la fuente) igual tiene que
    // poder dibujar una línea
    const vieja: SeriePunto[] = [
      { fecha: "2020-01-01", valor: 60 },
      { fecha: "2020-01-02", valor: 61 },
      { fecha: "2020-01-03", valor: 62 },
    ];
    expect(recortarRango(vieja, 7)).toHaveLength(2);
    expect(recortarRango(vieja, 7)).toEqual(vieja.slice(-2));
  });
});
