import { describe, expect, it } from "vitest";
import { categoriaRiesgoPais } from "./riesgoPais";

describe("categoriaRiesgoPais", () => {
  it("clasifica según los umbrales de mercado", () => {
    expect(categoriaRiesgoPais(350).tone).toBe("low");
    expect(categoriaRiesgoPais(700).tone).toBe("medium");
    expect(categoriaRiesgoPais(1200).tone).toBe("high");
    expect(categoriaRiesgoPais(1800).tone).toBe("critical");
  });

  it("los bordes de cada umbral caen en la categoría de arriba", () => {
    expect(categoriaRiesgoPais(399).tone).toBe("low");
    expect(categoriaRiesgoPais(400).tone).toBe("medium");
    expect(categoriaRiesgoPais(799).tone).toBe("medium");
    expect(categoriaRiesgoPais(800).tone).toBe("high");
    expect(categoriaRiesgoPais(1499).tone).toBe("high");
    expect(categoriaRiesgoPais(1500).tone).toBe("critical");
  });
});
