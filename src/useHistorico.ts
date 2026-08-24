import { useEffect, useState } from "react";
import { hoyEnArgentina } from "./fechas";
import { loadFromCache, saveToCache } from "./offlineCache";

// Serie normalizada que consumen el sparkline y el panel expandido, sin
// importar de qué fuente venga (dólar, riesgo país o mercados).
export interface SeriePunto {
  fecha: string;
  valor: number;
}

// ArgentinaDatos no soporta rangos: ?desde / ?limit se ignoran y siempre
// devuelve la serie completa (el dólar arranca en 2011, el riesgo país en
// 1999). Como solo necesitamos el último año, la recortamos apenas llega y
// guardamos en localStorage nada más que ese pedazo. En las visitas siguientes
// no se vuelve a pedir hasta el día siguiente.
const DOLARES_URL = "https://api.argentinadatos.com/v1/cotizaciones/dolares";
const RIESGO_PAIS_URL = "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais";
const DIAS_A_GUARDAR = 400;

// Solo estas casas tienen serie histórica. Euro y real devuelven 404, así que
// sus tarjetas no muestran gráfico.
const CASAS_CON_HISTORICO = new Set([
  "oficial",
  "blue",
  "bolsa",
  "contadoconliqui",
  "cripto",
  "tarjeta",
]);

export function tieneHistorico(casa: string): boolean {
  return CASAS_CON_HISTORICO.has(casa);
}

interface CacheEntry {
  fetchedAt: string;
  puntos: SeriePunto[];
}

// Varias tarjetas piden la misma serie a la vez; sin esto cada una dispararía
// su propio fetch del mismo recurso.
const enVuelo = new Map<string, Promise<SeriePunto[]>>();

async function traerSerie(
  clave: string,
  url: string,
  mapear: (crudo: never[]) => SeriePunto[]
): Promise<SeriePunto[]> {
  const cached = loadFromCache<CacheEntry>(clave);
  if (cached?.fetchedAt === hoyEnArgentina() && cached.puntos.length > 0) {
    return cached.puntos;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const crudo = await res.json();

  const puntos = mapear(crudo).slice(-DIAS_A_GUARDAR);
  saveToCache<CacheEntry>(clave, { fetchedAt: hoyEnArgentina(), puntos });
  return puntos;
}

function getSerie(
  clave: string,
  url: string,
  mapear: (crudo: never[]) => SeriePunto[]
): Promise<SeriePunto[]> {
  const existente = enVuelo.get(clave);
  if (existente) return existente;

  const promesa = traerSerie(clave, url, mapear).finally(() => {
    enVuelo.delete(clave);
  });
  enVuelo.set(clave, promesa);
  return promesa;
}

function useSerie(
  clave: string | null,
  url: string,
  mapear: (crudo: never[]) => SeriePunto[]
): SeriePunto[] | null {
  const [puntos, setPuntos] = useState<SeriePunto[] | null>(null);

  useEffect(() => {
    if (!clave) return;

    let vigente = true;
    getSerie(clave, url, mapear)
      .then((datos) => {
        if (vigente) setPuntos(datos);
      })
      .catch(() => {
        // sin histórico la tarjeta simplemente no muestra el gráfico
        if (vigente) setPuntos(null);
      });

    return () => {
      vigente = false;
    };
  }, [clave, url, mapear]);

  return puntos;
}

// Los mapeadores viven en el módulo para que su identidad sea estable y no
// reejecuten el efecto en cada render.
const mapearDolar = (crudo: { fecha: string; venta: number }[]): SeriePunto[] =>
  crudo.map(({ fecha, venta }) => ({ fecha, valor: venta }));

const mapearRiesgoPais = (crudo: { fecha: string; valor: number }[]): SeriePunto[] =>
  crudo.map(({ fecha, valor }) => ({ fecha, valor }));

export function useHistoricoDolar(casa: string): SeriePunto[] | null {
  return useSerie(
    tieneHistorico(casa) ? `hist:${casa}` : null,
    `${DOLARES_URL}/${casa}`,
    mapearDolar as (crudo: never[]) => SeriePunto[]
  );
}

export function useHistoricoRiesgoPais(): SeriePunto[] | null {
  return useSerie(
    "hist:riesgo-pais",
    RIESGO_PAIS_URL,
    mapearRiesgoPais as (crudo: never[]) => SeriePunto[]
  );
}

// Los mercados vienen todos juntos en un solo pedido a nuestro proxy (un
// crédito de Twelve Data por símbolo), así que no encajan en useSerie, que
// asume una serie por URL.
interface CacheMercados {
  fetchedAt: string;
  series: Record<string, SeriePunto[]>;
}

let mercadosEnVuelo: Promise<Record<string, SeriePunto[]>> | null = null;

// El plan gratuito de Twelve Data permite 8 créditos por minuto y cada uno de
// nuestros dos endpoints necesita 8 (uno por símbolo). Si /api/market y
// /api/history salen juntos con el CDN frío —la primera carga después de cada
// deploy— uno de los dos recibe 429 sí o sí.
//
// No esperamos de arranque, porque con el CDN caliente la respuesta es
// instantánea y penalizaríamos a todos. Reintentamos una sola vez pasado el
// minuto, que es cuando el cupo se renueva. Mientras tanto la tarjeta se ve
// completa salvo el mini gráfico.
export const ESPERA_CUPO_MS = 65_000;

async function pedirMercados(): Promise<Record<string, SeriePunto[]>> {
  const res = await fetch("/api/history");
  if (!res.ok) {
    // Mismo motivo que en /api/market: sin esto el fallo del histórico es
    // completamente silencioso, porque la tarjeta simplemente no dibuja nada.
    console.warn("[DollarTracker] /api/history falló:", res.status, await res.json().catch(() => null));
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

async function traerMercados(): Promise<Record<string, SeriePunto[]>> {
  const cached = loadFromCache<CacheMercados>("hist:mercados");
  if (cached?.fetchedAt === hoyEnArgentina() && Object.keys(cached.series).length > 0) {
    return cached.series;
  }

  let series: Record<string, SeriePunto[]>;
  try {
    series = await pedirMercados();
  } catch {
    await new Promise((resolve) => setTimeout(resolve, ESPERA_CUPO_MS));
    series = await pedirMercados();
  }

  saveToCache<CacheMercados>("hist:mercados", { fetchedAt: hoyEnArgentina(), series });
  return series;
}

export function useHistoricoMercados(): Record<string, SeriePunto[]> | null {
  const [series, setSeries] = useState<Record<string, SeriePunto[]> | null>(null);

  useEffect(() => {
    let vigente = true;

    if (!mercadosEnVuelo) {
      mercadosEnVuelo = traerMercados().finally(() => {
        mercadosEnVuelo = null;
      });
    }

    mercadosEnVuelo
      .then((datos) => {
        if (vigente) setSeries(datos);
      })
      .catch(() => {
        // sin histórico las tarjetas simplemente no muestran gráfico
        if (vigente) setSeries(null);
      });

    return () => {
      vigente = false;
    };
  }, []);

  return series;
}

export type RangoDias = 7 | 30 | 90 | 365;

export const RANGOS: { dias: RangoDias; label: string }[] = [
  { dias: 7, label: "7d" },
  { dias: 30, label: "30d" },
  { dias: 90, label: "90d" },
  { dias: 365, label: "1 año" },
];

export function recortarRango(puntos: SeriePunto[], dias: RangoDias): SeriePunto[] {
  // La ventana se cuenta desde el día argentino. Con new Date() + toISOString()
  // el corte se adelantaba un día entre las 21 hs y la medianoche de acá, que
  // es exactamente el mismo error que fechas.ts ya había corregido para la
  // variación diaria.
  const corte = new Date(`${hoyEnArgentina()}T12:00:00Z`);
  corte.setUTCDate(corte.getUTCDate() - dias);
  const corteISO = corte.toISOString().slice(0, 10);
  const recorte = puntos.filter((p) => p.fecha >= corteISO);
  // Si la serie viene con huecos (feriados largos), garantizamos al menos dos
  // puntos para que el gráfico tenga una línea que dibujar.
  return recorte.length >= 2 ? recorte : puntos.slice(-2);
}
