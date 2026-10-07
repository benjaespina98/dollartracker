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

  it("avisa el límite de cuota sin filtrar el mensaje del proveedor", async () => {
    responderCon(429, { code: 429, status: "error", message: "You have run out of API credits" });

    const res = await handler(req);
    const texto = await res.text();
    expect(res.status).toBe(502);
    expect(JSON.parse(texto).motivo).toBe("limite_de_cuota");
    expect(texto).not.toContain("credits");
  });

  it("con la key inválida responde un error genérico, sin pistas de configuración", async () => {
    responderCon(401, { code: 401, status: "error", message: "Invalid API key" });

    const res = await handler(req);
    const texto = await res.text();
    expect(res.status).toBe(502);
    expect(texto).not.toMatch(/key|Vercel/i);
  });

  it("rechaza cualquier query string", async () => {
    responderCon(200, {});
    expect((await handler(new Request("https://x.test/api/history?a=1"))).status).toBe(400);
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

  it("no expone Access-Control-Allow-Origin a un origen no permitido", async () => {
    const conOrigen = new Request("https://x.test/api/history", {
      headers: { Origin: "https://evil.example" },
    });
    responderCon(200, { USO: { status: "ok", values: [{ datetime: "2026-08-07", close: "118.50" }, { datetime: "2026-08-06", close: "117.20" }] } });
    const res = await handler(conOrigen);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("refleja el origen de producción en Access-Control-Allow-Origin", async () => {
    const conOrigen = new Request("https://x.test/api/history", {
      headers: { Origin: "https://dollartracker.vercel.app" },
    });
    responderCon(200, { USO: { status: "ok", values: [{ datetime: "2026-08-07", close: "118.50" }, { datetime: "2026-08-06", close: "117.20" }] } });
    const res = await handler(conOrigen);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://dollartracker.vercel.app");
  });
});

describe("/api/history: casos límite", () => {
  const velasOk = {
    USO: {
      status: "ok",
      values: [
        { datetime: "2026-08-07", close: "118.50" },
        { datetime: "2026-08-06", close: "117.20" },
      ],
    },
  };

  it("rechaza métodos que no sean GET o HEAD", async () => {
    responderCon(200, velasOk);
    const res = await handler(new Request("https://x.test/api/history", { method: "POST" }));
    expect(res.status).toBe(405);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("contesta el preflight de CORS sin tocar al proveedor", async () => {
    responderCon(200, velasOk);
    const res = await handler(new Request("https://x.test/api/history", { method: "OPTIONS" }));
    expect(res.status).toBe(204);
    expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
  });

  it("si el proveedor no responde (red o timeout) devuelve un error genérico", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;

    const res = await handler(req);
    const texto = await res.text();
    expect(res.status).toBe(502);
    expect(texto).not.toContain("fetch failed");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("falla con 502 si el proveedor responde algo que no es un objeto", async () => {
    responderCon(200, [1, 2, 3]);
    expect((await handler(req)).status).toBe(502);
  });

  it("falla con 502 si la respuesta del proveedor no es JSON", async () => {
    globalThis.fetch = vi.fn(async () => new Response("<html>oops</html>", { status: 200 })) as typeof fetch;
    expect((await handler(req)).status).toBe(502);
  });

  it("descarta las velas con un cierre que no es un número", async () => {
    responderCon(200, {
      USO: {
        status: "ok",
        values: [
          { datetime: "2026-08-08", close: "no-es-numero" },
          { datetime: "2026-08-07", close: "118.50" },
          { datetime: "2026-08-06", close: "117.20" },
        ],
      },
    });

    const body = await (await handler(req)).json();
    expect(body.oil).toEqual([
      { fecha: "2026-08-06", valor: 117.2 },
      { fecha: "2026-08-07", valor: 118.5 },
    ]);
  });

  it("pide todos los símbolos en un solo pedido y 400 velas", async () => {
    responderCon(200, velasOk);
    await handler(req);

    const url = String(vi.mocked(globalThis.fetch).mock.calls[0][0]);
    expect(url).toContain("interval=1day");
    expect(url).toContain("outputsize=400");
    for (const simbolo of ["USO", "GLD", "SPY", "DIA", "QQQ", "SOYB", "CORN", "WEAT"]) {
      expect(decodeURIComponent(url)).toContain(simbolo);
    }
  });

  it("nunca incluye la API key en ninguna respuesta de error", async () => {
    for (const [status, cuerpo] of [
      [401, { code: 401, status: "error", message: "Invalid API key clave-de-prueba" }],
      [429, { code: 429, status: "error", message: "límite clave-de-prueba" }],
      [500, { code: 500, status: "error", message: "boom clave-de-prueba" }],
    ] as const) {
      responderCon(status, cuerpo);
      expect(await (await handler(req)).text()).not.toContain("clave-de-prueba");
    }
  });
});
