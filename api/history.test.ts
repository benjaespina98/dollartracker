import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./history";

const req = new Request("https://x.test/api/history");
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

describe("/api/history", () => {
  it("da vuelta las velas al orden cronológico", async () => {
    // Twelve Data devuelve de más nueva a más vieja. Si esto se rompe, el
    // gráfico sale espejado y sigue pareciendo un gráfico normal.
    responderCon(200, {
      USO: {
        status: "ok",
        values: [
          { datetime: "2026-08-07", close: "118.50" },
          { datetime: "2026-08-06", close: "117.20" },
          { datetime: "2026-08-05", close: "116.00" },
        ],
      },
    });

    const body = await (await handler(req)).json();
    expect(body.oil).toEqual([
      { fecha: "2026-08-05", valor: 116 },
      { fecha: "2026-08-06", valor: 117.2 },
      { fecha: "2026-08-07", valor: 118.5 },
    ]);
  });

  it("mapea cada símbolo a su clave interna", async () => {
    responderCon(200, {
      SOYB: {
        status: "ok",
        values: [
          { datetime: "2026-08-07", close: "23.10" },
          { datetime: "2026-08-06", close: "22.80" },
        ],
      },
    });

    const body = await (await handler(req)).json();
    expect(Object.keys(body)).toEqual(["soja"]);
  });

  it("un símbolo fallado no tumba a los demás", async () => {
    responderCon(200, {
      USO: {
        status: "ok",
        values: [
          { datetime: "2026-08-07", close: "118.50" },
          { datetime: "2026-08-06", close: "117.20" },
        ],
      },
      WEAT: { status: "error", code: 404, message: "symbol not found" },
    });

    const body = await (await handler(req)).json();
    expect(body.oil).toHaveLength(2);
    expect(body.trigo).toBeUndefined();
  });

  it("cachea las respuestas buenas 12 horas", async () => {
    responderCon(200, {
      USO: {
        status: "ok",
        values: [
          { datetime: "2026-08-07", close: "118.50" },
          { datetime: "2026-08-06", close: "117.20" },
        ],
      },
    });

    const res = await handler(req);
    expect(res.headers.get("Cache-Control")).toBe("s-maxage=43200, stale-while-revalidate=86400");
  });

  it("propaga el motivo real cuando se acaban los créditos", async () => {
    responderCon(429, { code: 429, status: "error", message: "You have run out of API credits" });

    const res = await handler(req);
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.upstreamStatus).toBe(429);
    expect(body.upstreamMessage).toBe("You have run out of API credits");
    expect(body.hint).toContain("créditos");
  });

  it("propaga el motivo real cuando la key es inválida", async () => {
    responderCon(401, { code: 401, status: "error", message: "Invalid API key" });

    const body = await (await handler(req)).json();
    expect(body.upstreamStatus).toBe(401);
    expect(body.hint).toContain("Vercel");
  });

  it("detecta el error aunque venga con HTTP 200", async () => {
    // Twelve Data a veces responde 200 con { code, message } en el cuerpo
    responderCon(200, { code: 429, status: "error", message: "límite por minuto" });
    expect((await handler(req)).status).toBe(502);
  });

  it("no cachea los errores", async () => {
    responderCon(429, { code: 429, status: "error", message: "sin créditos" });
    expect((await handler(req)).headers.get("Cache-Control")).toBe("no-store");
  });

  it("falla si ninguna serie tiene al menos dos puntos", async () => {
    responderCon(200, { USO: { status: "ok", values: [{ datetime: "2026-08-07", close: "118.50" }] } });
    expect((await handler(req)).status).toBe(502);
  });

  it("avisa si falta la API key, sin cachearlo", async () => {
    delete process.env.TWELVE_DATA_API_KEY;
    const res = await handler(req);
    expect(res.status).toBe(500);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
