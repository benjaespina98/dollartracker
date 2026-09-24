import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorHttp, esCotizacion, esRiesgoPais, pedirJson } from "./http";

const fetchOriginal = globalThis.fetch;
const cualquiera = (d: unknown): d is unknown => d !== undefined;
const opciones = { esperaBaseMs: 1 };

function respuesta(status: number, cuerpo: unknown = {}) {
  return new Response(JSON.stringify(cuerpo), { status });
}

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

describe("pedirJson", () => {
  it("reintenta ante un 5xx y devuelve el dato cuando el proveedor se recupera", async () => {
    const mock = vi.fn().mockResolvedValueOnce(respuesta(503)).mockResolvedValueOnce(respuesta(200, { ok: 1 }));
    globalThis.fetch = mock as typeof fetch;
    await expect(pedirJson("/x", new AbortController().signal, cualquiera, opciones)).resolves.toEqual({ ok: 1 });
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("no reintenta un 404", async () => {
    const mock = vi.fn().mockResolvedValue(respuesta(404));
    globalThis.fetch = mock as typeof fetch;
    await expect(pedirJson("/x", new AbortController().signal, cualquiera, opciones)).rejects.toBeInstanceOf(ErrorHttp);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("se rinde tras agotar los reintentos", async () => {
    const mock = vi.fn().mockRejectedValue(new TypeError("red caída"));
    globalThis.fetch = mock as typeof fetch;
    await expect(pedirJson("/x", new AbortController().signal, cualquiera, opciones)).rejects.toThrow("red caída");
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it("rechaza una respuesta con forma inesperada", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(respuesta(200, { compra: "10" })) as typeof fetch;
    await expect(pedirJson("/x", new AbortController().signal, esCotizacion, { reintentos: 0 })).rejects.toThrow(
      "formato inesperado"
    );
  });

  it("no reintenta si se abortó a propósito", async () => {
    const control = new AbortController();
    const mock = vi.fn().mockImplementation(async () => {
      control.abort();
      throw new DOMException("abort", "AbortError");
    });
    globalThis.fetch = mock as typeof fetch;
    await expect(pedirJson("/x", control.signal, cualquiera, opciones)).rejects.toThrow();
    expect(mock).toHaveBeenCalledTimes(1);
  });
});

describe("validadores", () => {
  it("aceptan la forma esperada y rechazan el resto", () => {
    expect(esRiesgoPais({ valor: 580, fecha: "2026-09-23" })).toBe(true);
    expect(esRiesgoPais({ valor: "580" })).toBe(false);
    expect(esRiesgoPais(null)).toBe(false);
    expect(esCotizacion({ moneda: "USD", nombre: "Blue", compra: 1, venta: 2, fechaActualizacion: "x" })).toBe(true);
    expect(esCotizacion([])).toBe(false);
  });
});
