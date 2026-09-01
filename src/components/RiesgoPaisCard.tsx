import type { ReactNode } from "react";
import { useMemo } from "react";
import { cierreAnterior } from "../lib/fechas";
import { entero, fechaDelDia, formatearDiaMes, formatearHaceTiempo } from "../lib/format";
import { useHistoricoRiesgoPais } from "../hooks/useHistorico";
import type { RiesgoPais } from "../types";
import CardShell, { type CardStatus } from "./CardShell";
import { HoraDato, OfflineTag, Variacion } from "./CardMeta";

interface Props {
  icon: ReactNode;
  accent: string;
  data: RiesgoPais | null;
  status: CardStatus;
  /** Date.now() de cuando se guardó el dato que se está mostrando, para el "hace X min" del aviso offline */
  savedAt: number | null;
}

// Umbrales informales usados habitualmente para leer el índice de riesgo país
function getCategory(valor: number): { label: string; tone: "low" | "medium" | "high" | "critical" } {
  if (valor < 400) return { label: "Bajo", tone: "low" };
  if (valor < 800) return { label: "Moderado", tone: "medium" };
  if (valor < 1500) return { label: "Alto", tone: "high" };
  return { label: "Crítico", tone: "critical" };
}

export default function RiesgoPaisCard({ icon, accent, data, status, savedAt }: Props) {
  const historico = useHistoricoRiesgoPais();
  const cierrePrevio = useMemo(() => cierreAnterior(historico), [historico]);

  const diff = data && cierrePrevio ? data.valor - cierrePrevio.valor : null;
  const categoria = data ? getCategory(data.valor) : null;
  const fecha = data ? fechaDelDia(data.fecha) : null;

  return (
    <CardShell
      label="Riesgo País"
      icon={icon}
      accent={accent}
      status={status}
      hayDatos={!!data}
      serie={historico}
      formatValor={(valor) => `${entero.format(Math.round(valor))} pb`}
      shareText={data ? `Riesgo País: ${entero.format(data.valor)} puntos básicos — DollarTracker` : null}
      info={
        <>
          El EMBI+ mide, en puntos básicos, cuánto más pagaría Argentina que el Tesoro de EE. UU. para
          financiarse: a mayor valor, mayor riesgo de default percibido por el mercado. El gráfico muestra su
          cierre diario, con mínimo y máximo del período. Las categorías (bajo, moderado, alto, crítico) son
          umbrales de mercado orientativos, no un dato oficial. Datos de ArgentinaDatos.
        </>
      }
      meta={
        <>
          {status === "stale" && fecha && (
            <OfflineTag
              title={`No se pudo actualizar; este es el último valor guardado en este dispositivo, del ${formatearDiaMes(fecha)}`}
              haceTiempo={savedAt !== null ? formatearHaceTiempo(savedAt) : undefined}
            />
          )}
          {status !== "stale" && diff !== null && cierrePrevio && (
            <Variacion
              valor={diff}
              texto={`${Math.abs(diff)} pb`}
              title={`Variación contra el cierre del ${formatearDiaMes(fechaDelDia(cierrePrevio.fecha))} (${entero.format(cierrePrevio.valor)} pb)`}
            />
          )}
          {fecha && (
            <HoraDato texto={formatearDiaMes(fecha)} title={`Último cierre informado: ${data?.fecha}`} />
          )}
        </>
      }
    >
      {data && categoria && (
        <div className="riesgoBlock">
          <div className="riesgoBlock__row">
            <span className="riesgoBlock__value">{entero.format(data.valor)}</span>
            <span className="riesgoBlock__unit">pb</span>
            <span className={`riesgoTag riesgoTag--${categoria.tone}`}>{categoria.label}</span>
          </div>
        </div>
      )}
    </CardShell>
  );
}
