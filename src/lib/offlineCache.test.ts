import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadFromCache, saveToCache } from "./offlineCache";

const almacen = new Map<string, string>();

beforeEach(() => {
  almacen.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => almacen.get(k) ?? null,
    setItem: (k: string, v: string) => void almacen.set(k, v),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("offlineCache", () => {
  it("guarda y recupera el dato con su hora", () => {
    const savedAt = saveToCache("blue", { venta: 1400 });
    expect(loadFromCache("blue")).toEqual({ data: { venta: 1400 }, savedAt });
  });

  it("devuelve null si no hay nada o el contenido está corrupto", () => {
    expect(loadFromCache("nada")).toBeNull();
    almacen.set("dollartracker:cache:roto", "{no es json");
    expect(loadFromCache("roto")).toBeNull();
  });

  it("no falla si localStorage lanza (modo privado, cuota llena)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("cuota");
      },
    });
    expect(() => saveToCache("x", 1)).not.toThrow();
    expect(loadFromCache("x")).toBeNull();
  });
});
