import type { ReactNode } from "react";
import { dolares, formatearFechaHora, formatearHaceTiempo, formatearHora } from "../lib/format";
import type { SeriePunto } from "../hooks/useHistorico";
import type { MarketQuote } from "../types";
import CardShell, { type CardStatus } from "./CardShell";
import { HoraDato, OfflineTag, Variacion } from "./CardMeta";

interface Props {
  label: string;
  icon: ReactNode;
  /** Ticker del ETF que se usa como referencia (se muestra bajo el precio) */
  ticker: string;
  /** Qué sigue ese ETF; solo aparece en el panel (i) de la tarjeta abierta */
  detalle: string;
  accent: string;
  data: MarketQuote | null;
  status: CardStatus;
  /** Date.now() de cuando se guardó el dato que se está mostrando, para el "hace X min" del aviso offline */
  savedAt: number | null;
  /** Serie diaria del símbolo, null mientras carga o si falló */
  historico: SeriePunto[] | null;
}

export default function MarketCard({ label, icon, ticker, detalle, accent, data, status, savedAt, historico }: Props) {
  const cierre = data?.marketTime ? new Date(data.marketTime * 1000) : null;

  return (
    <CardShell
      label={label}
      icon={icon}
      accent={accent}
      status={status}
      hayDatos={!!data}
      serie={historico}
      formatValor={(valor) => dolares.format(valor)}
      shareText={
        data
          ? `${label}: ${dolares.format(data.price)}${
              data.changePercent !== null
                ? ` (${data.changePercent > 0 ? "+" : ""}${data.changePercent.toFixed(2)}%)`
                : ""
            } — DollarTracker`
          : null
      }
      info={
        <>
          {detalle}. El gráfico muestra el precio de cierre diario del ETF <strong>{ticker}</strong>, usado como
          referencia del activo, con su mínimo y máximo del período elegido. Datos de Twelve Data. No es
          asesoramiento financiero.
        </>
      }
      meta={
        <>
          {status === "stale" && (
            <OfflineTag
              title={
                cierre
                  ? `No se pudo actualizar; este es el último valor guardado en este dispositivo, del ${formatearFechaHora(cierre)} hs`
                  : "No se pudo actualizar; este es el último valor guardado en este dispositivo"
              }
              haceTiempo={savedAt !== null ? formatearHaceTiempo(savedAt) : undefined}
            />
          )}
          {status !== "stale" && data?.changePercent != null && (
            <Variacion
              valor={data.changePercent}
              texto={`${Math.abs(data.changePercent).toFixed(2)}%`}
              title={`Variación contra el cierre anterior${
                data.previousClose !== null ? ` (${dolares.format(data.previousClose)})` : ""
              }`}
            />
          )}
          {cierre && (
            <HoraDato
              texto={`${formatearHora(cierre)} hs`}
              title={`Último cierre de mercado: ${formatearFechaHora(cierre)} hs`}
            />
          )}
        </>
      }
    >
      {data && (
        <div className="marketPrice">
          <span className="marketPrice__value">{dolares.format(data.price)}</span>
          <span className="marketPrice__unit" title={detalle}>
            {ticker}
          </span>
        </div>
      )}
    </CardShell>
  );
}
