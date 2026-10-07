import { aCotizacionBitcoin, BTC_TICKER_URL, esTicker24h } from "../lib/bitcoin";
import { pedirJson } from "../lib/http";
import type { MarketQuote } from "../types";
import { useResource } from "./useResource";

async function pedirBitcoin(signal: AbortSignal): Promise<MarketQuote> {
  return aCotizacionBitcoin(await pedirJson(BTC_TICKER_URL, signal, esTicker24h));
}

// Bitcoin se mueve las 24 horas, así que se refresca cada minuto (Binance lo
// permite de sobra). Como el dólar, cae a la última copia local si falla.
export function useBitcoin() {
  return useResource<MarketQuote>({ cacheKey: "btc", fetcher: pedirBitcoin, intervalMs: 60_000 });
}
