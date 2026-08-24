import { useMemo, type ReactNode } from "react";
import { convertir, formatearMoneda, type MonedaOrigen } from "../conversion";
import { cierreAnterior } from "../fechas";
import { formatearFechaHora, formatearHora, pesos } from "../format";
import { tieneHistorico, useHistoricoDolar } from "../useHistorico";
import type { Cotizacion } from "../types";
import CardShell, { type CardStatus } from "./CardShell";
import { HoraDato, OfflineTag, Variacion } from "./CardMeta";

interface Props {
  /** Clave de la casa en DolarAPI; también es el slug del histórico */
  casa: string;
  label: string;
  /** Nombre completo, para el tooltip y los lectores de pantalla */
  nombre: string;
  icon: ReactNode;
  accent: string;
  data: Cotizacion | null;
  status: CardStatus;
  /** Monto tipeado en la barra conversora, null si está vacía */
  monto: number | null;
  origen: MonedaOrigen;
}

export default function QuoteCard({ casa, label, nombre, icon, accent, data, status, monto, origen }: Props) {
  const historico = useHistoricoDolar(casa);

  // La variación se mide siempre contra el último cierre previo a hoy, igual
  // que la que Twelve Data calcula para los mercados. Euro y real no tienen
  // serie en ArgentinaDatos: ahí no se muestra badge, en vez del "0,00%" que
  // salía antes por comparar contra el valor de hace cinco minutos.
  const cierrePrevio = useMemo(() => cierreAnterior(historico), [historico]);

  const variacion =
    data && cierrePrevio && cierrePrevio.valor !== 0
      ? ((data.venta - cierrePrevio.valor) / cierrePrevio.valor) * 100
      : null;

  // Con monto cargado la tarjeta deja de mostrar compra/venta y pasa a
  // responder "cuánto me dan": es el modo conversión. Devuelve null cuando
  // esta tarjeta no aplica al origen elegido (escribiste euros y esta es una
  // tarjeta de dólar): ahí seguimos con compra/venta.
  const convertido =
    data && monto !== null ? convertir(monto, origen, data.moneda, data.compra, data.venta) : null;

  const actualizado = data ? new Date(data.fechaActualizacion) : null;

  return (
    <CardShell
      label={label}
      nombre={nombre}
      icon={icon}
      accent={accent}
      status={status}
      hayDatos={!!data}
      skeletonBlocks={2}
      serie={historico}
      conGrafico={tieneHistorico(casa)}
      formatValor={(valor) => pesos.format(valor)}
      shareText={
        data
          ? `${nombre}: compra ${pesos.format(data.compra)} · venta ${pesos.format(data.venta)} — DollarTracker`
          : null
      }
      info={
        <>
          El gráfico muestra el valor de venta al cierre de cada día, con el mínimo y el máximo del período
          elegido. La cotización actual la publica DolarAPI; la serie histórica, ArgentinaDatos. Es un valor de
          referencia: puede diferir del que te ofrezca tu banco, billetera o casa de cambio.
        </>
      }
      meta={
        <>
          {status === "stale" && actualizado && (
            <OfflineTag
              title={`No se pudo actualizar; este es el último valor guardado en este dispositivo, del ${formatearFechaHora(actualizado)} hs`}
            />
          )}
          {status !== "stale" && variacion !== null && cierrePrevio && (
            <Variacion
              valor={variacion}
              texto={`${Math.abs(variacion).toFixed(2)}%`}
              title={`Variación de la venta contra el cierre del ${cierrePrevio.fecha
                .split("-")
                .reverse()
                .slice(0, 2)
                .join("/")} (${pesos.format(cierrePrevio.valor)})`}
            />
          )}
          {actualizado && (
            <HoraDato
              texto={`${formatearHora(actualizado)} hs`}
              title={`DolarAPI informó este valor el ${formatearFechaHora(actualizado)} hs. No todas las cotizaciones se actualizan a la misma frecuencia.`}
            />
          )}
        </>
      }
    >
      {data &&
        (convertido !== null ? (
          <div className="convertedBlock">
            <span className="convertedBlock__value">{formatearMoneda(convertido.valor, convertido.moneda)}</span>
            <span className="convertedBlock__rate">
              a {pesos.format(convertido.tasa)} ({convertido.punta})
            </span>
          </div>
        ) : (
          <div className="quotePrices">
            <div className="quotePriceBlock">
              <span className="quotePriceLabel">Compra</span>
              <span className="quotePriceValue">{pesos.format(data.compra)}</span>
            </div>
            <div className="quotePriceBlock quotePriceBlock--venta">
              <span className="quotePriceLabel">Venta</span>
              <span className="quotePriceValue quotePriceValue--accent">{pesos.format(data.venta)}</span>
            </div>
          </div>
        ))}
    </CardShell>
  );
}
