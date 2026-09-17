import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./market";

const req = new Request("https://x.test/api/market");
const fetchOriginal = globalThis.fetch;

function responderCon(status: number, body: unknown) {
  globalThis.fetch = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      })
  ) as typeof fetch;
}

beforeEach(() => {
  process.env.TWELVE_DATA_API_KEY = "clave-de-prueba";
});

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

describe("/api/market", () => {
  it("mapea cada símbolo de Twelve Data a su clave interna", async () => {
    responderCon(200, {
      USO: { symbol: "USO", currency: "USD", close: "78.32", previous_close: "77.10", change: "1.22", percent_change: "1.58", timestamp: 1_756_051_200 },
    });

    const body = await (await handler(req)).json();
    expect(body.oil).toEqual({
      symbol: "USO",
      currency: "USD",
      price: 78.32,
      previousClose: 77.1,
      change: 1.22,
      changePercent: 1.58,
      marketTime: 1_756_051_200,
    });
  });

  it("un símbolo fallado no tumba a los demás: queda null", async () => {
    responderCon(200, {
      USO: { symbol: "USO", currency: "USD", close: "78.32" },
      WEAT: { code: 404, message: "symbol not found" },
    });

    const body = await (await handler(req)).json();
    expect(body.oil).not.toBeNull();
    expect(body.trigo).toBeNull();
  });

  it("cachea las respuestas buenas 30 minutos", async () => {
    responderCon(200, { USO: { symbol: "USO", currency: "USD", close: "78.32" } });

    const res = await handler(req);
    expect(res.headers.get("Cache-Control")).toBe("s-maxage=1800, stale-while-revalidate=7200");
  });

  it("propaga el motivo real cuando se acaban los créditos", async () => {
    responderCon(429, { code: 429, status: "error", message: "You have run out of API credits" });

    const res = await handler(req);
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.upstreamStatus).toBe(429);
    expect(body.hint).toContain("créditos");
  });

  it("detecta el error aunque venga con HTTP 200", async () => {
    responderCon(200, { code: 429, status: "error", message: "límite por minuto" });
    expect((await handler(req)).status).toBe(502);
  });

  it("no cachea los errores", async () => {
    responderCon(429, { code: 429, status: "error", message: "sin créditos" });
    expect((await handler(req)).headers.get("Cache-Control")).toBe("no-store");
  });

  it("falla si ningún símbolo resolvió, en vez de cachear una tanda toda en null", async () => {
    responderCon(200, { USO: { code: 404, message: "symbol not found" } });
    expect((await handler(req)).status).toBe(502);
  });

  it("avisa si falta la API key, sin cachearlo", async () => {
    delete process.env.TWELVE_DATA_API_KEY;
    const res = await handler(req);
    expect(res.status).toBe(500);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("no expone Access-Control-Allow-Origin a un origen no permitido", async () => {
    const conOrigen = new Request("https://x.test/api/market", {
      headers: { Origin: "https://evil.example" },
    });
    responderCon(200, { USO: { symbol: "USO", currency: "USD", close: "78.32" } });
    const res = await handler(conOrigen);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("refleja el origen de producción en Access-Control-Allow-Origin", async () => {
    const conOrigen = new Request("https://x.test/api/market", {
      headers: { Origin: "https://dollartracker.vercel.app" },
    });
    responderCon(200, { USO: { symbol: "USO", currency: "USD", close: "78.32" } });
    const res = await handler(conOrigen);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://dollartracker.vercel.app");
  });
});
