import type { ReactNode } from "react";
import { useMemo } from "react";
import { cierreAnterior } from "../lib/fechas";
import { entero, fechaDelDia, formatearDiaMes } from "../lib/format";
import { categoriaRiesgoPais } from "../lib/riesgoPais";
import { useHistoricoRiesgoPais } from "../hooks/useHistorico";
import type { RiesgoPais } from "../types";
import CardShell, { type CardStatus } from "./CardShell";
import { HoraDato, OfflineTag, Variacion } from "./CardMeta";
import { InfoFicha } from "./InfoFicha";
import ValorAnimado from "./ValorAnimado";

interface Props {
  icon: ReactNode;
  accent: string;
  data: RiesgoPais | null;
  status: CardStatus;
  /** Date.now() de cuando se guardó el dato que se está mostrando, para el "hace X min" del aviso offline */
  savedAt: number | null;
  favorito: boolean;
  onToggleFavorito: () => void;
}

export default function RiesgoPaisCard({ icon, accent, data, status, savedAt, favorito, onToggleFavorito }: Props) {
  const historico = useHistoricoRiesgoPais();
  const cierrePrevio = useMemo(() => cierreAnterior(historico), [historico]);

  const diff = data && cierrePrevio ? data.valor - cierrePrevio.valor : null;
  const categoria = data ? categoriaRiesgoPais(data.valor) : null;
  const fecha = data ? fechaDelDia(data.fecha) : null;

  const tituloOffline = fecha
    ? `No se pudo actualizar; este es el último valor guardado en este dispositivo, del ${formatearDiaMes(fecha)}`
    : "";
  const tituloVariacion = cierrePrevio
    ? `Variación contra el cierre del ${formatearDiaMes(fechaDelDia(cierrePrevio.fecha))} (${entero.format(cierrePrevio.valor)} pb)`
    : "";

  return (
    <CardShell
      label="Riesgo País"
      icon={icon}
      accent={accent}
      status={status}
      hayDatos={!!data}
      favorito={favorito}
      onToggleFavorito={onToggleFavorito}
      serie={historico}
      formatValor={(valor) => `${entero.format(Math.round(valor))} pb`}
      shareText={data ? `Riesgo País: ${entero.format(data.valor)} puntos básicos — DollarTracker` : null}
      info={
        <>
          <p>
            El Índice de Bonos de Mercados Emergentes Plus (EMBI+) cuantifica, en puntos básicos, el sobrecosto de
            financiamiento de la deuda soberana en moneda extranjera respecto de los bonos del Tesoro de Estados
            Unidos. Un valor más alto refleja una mayor percepción de riesgo crediticio por parte del mercado.
          </p>
          <p className="infoAclaracion">
            Las categorías (bajo, moderado, alto, crítico) son umbrales de referencia definidos por esta aplicación
            y no constituyen una calificación crediticia oficial.
          </p>
          <InfoFicha fuente="ArgentinaDatos" referencia="Puntos básicos (pb)" referenciaLabel="Unidad" />
        </>
      }
      fila={{
        valor:
          data && (
            <ValorAnimado className="quoteRow__precio" valor={data.valor} texto={`${entero.format(data.valor)} pb`} />
          ),
        detalle: categoria?.label,
        chip:
          status === "stale" && fecha ? (
            <OfflineTag title={tituloOffline} savedAt={savedAt} />
          ) : status !== "stale" && diff !== null && cierrePrevio ? (
            <Variacion valor={diff} texto={`${Math.abs(diff)} pb`} title={tituloVariacion} />
          ) : null,
      }}
      meta={
        <>
          {status === "stale" && fecha && (
            <OfflineTag
              title={tituloOffline}
              savedAt={savedAt}
            />
          )}
          {status !== "stale" && diff !== null && cierrePrevio && (
            <Variacion
              valor={diff}
              texto={`${Math.abs(diff)} pb`}
              title={tituloVariacion}
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
            <ValorAnimado className="riesgoBlock__value" valor={data.valor} texto={entero.format(data.valor)} />
            <span className="riesgoBlock__unit">pb</span>
            <span className={`riesgoTag riesgoTag--${categoria.tone}`}>{categoria.label}</span>
          </div>
        </div>
      )}
    </CardShell>
  );
}
