import { describe, expect, it } from "vitest";
import { alternarFavorito, moverFavorito } from "./favoritos";

// leerFavoritos/guardarFavoritos tocan localStorage, que no existe en el
// entorno de test (Node puro, sin jsdom) — mismo motivo por el que
// offlineCache.ts tampoco tiene test propio. Se prueba la lógica pura.

describe("alternarFavorito", () => {
  it("agrega al final si no estaba", () => {
    expect(alternarFavorito(["oficial"], "blue")).toEqual(["oficial", "blue"]);
  });

  it("saca si ya estaba, sin tocar el orden del resto", () => {
    expect(alternarFavorito(["oficial", "blue", "riesgoPais"], "blue")).toEqual(["oficial", "riesgoPais"]);
  });
});

describe("moverFavorito", () => {
  const lista = ["oficial", "blue", "riesgoPais"];

  it("intercambia con el vecino de arriba", () => {
    expect(moverFavorito(lista, "blue", -1)).toEqual(["blue", "oficial", "riesgoPais"]);
  });

  it("intercambia con el vecino de abajo", () => {
    expect(moverFavorito(lista, "blue", 1)).toEqual(["oficial", "riesgoPais", "blue"]);
  });

  it("no hace nada si ya está en la punta hacia donde se lo mueve", () => {
    expect(moverFavorito(lista, "oficial", -1)).toEqual(lista);
    expect(moverFavorito(lista, "riesgoPais", 1)).toEqual(lista);
  });

  it("no hace nada con una clave que no está en la lista", () => {
    expect(moverFavorito(lista, "nasdaq", 1)).toEqual(lista);
  });
});
