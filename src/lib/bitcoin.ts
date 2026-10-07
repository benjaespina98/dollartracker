import type { MarketQuote } from "../types";

// Bitcoin sale de la API pública de Binance (par BTC/USDT): sin clave, con
// CORS abierto y un cupo muy holgado, así que se pide directo desde el
// navegador y no hace falta pasar por /api como los ETFs de Twelve Data.
const BINANCE = "https://api.binance.com/api/v3";
export const BTC_TICKER_URL = `${BINANCE}/ticker/24hr?symbol=BTCUSDT`;
export const BTC_KLINES_URL = `${BINANCE}/klines?symbol=BTCUSDT&interval=1d&limit=365`;

interface Ticker24h {
  openPrice: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  closeTime: number;
}

const esNumeroTexto = (valor: unknown): valor is string => typeof valor === "string" && Number.isFinite(Number(valor));

export function esTicker24h(datos: unknown): datos is Ticker24h {
  if (datos === null || typeof datos !== "object") return false;
  const t = datos as Record<string, unknown>;
  return (
    esNumeroTexto(t.openPrice) &&
    esNumeroTexto(t.lastPrice) &&
    esNumeroTexto(t.priceChange) &&
    esNumeroTexto(t.priceChangePercent) &&
    typeof t.closeTime === "number"
  );
}

/**
 * Ajusta la respuesta de Binance a la misma forma que usan las tarjetas de
 * mercado. A diferencia de los ETFs, la variación es la de las últimas 24 horas
 * (Bitcoin no tiene "cierre" diario), y `marketTime` va en segundos.
 */
export function aCotizacionBitcoin(t: Ticker24h): MarketQuote {
  return {
    symbol: "BTCUSDT",
    currency: "USD",
    price: Number(t.lastPrice),
    previousClose: Number(t.openPrice),
    change: Number(t.priceChange),
    changePercent: Number(t.priceChangePercent),
    marketTime: Math.floor(t.closeTime / 1000),
  };
}

/** Velas diarias de Binance → un punto por día con el precio de cierre. */
export function aSerieBitcoin(velas: unknown[]): { fecha: string; valor: number }[] {
  return velas.flatMap((vela) => {
    if (!Array.isArray(vela) || typeof vela[0] !== "number" || !esNumeroTexto(vela[4])) return [];
    return [{ fecha: new Date(vela[0]).toISOString().slice(0, 10), valor: Number(vela[4]) }];
  });
}
