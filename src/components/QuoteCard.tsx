import type { CSSProperties } from "react";
import type { Cotizacion } from "../types";

interface Props {
  icon: string;
  label: string;
  accent: string;
  data: Cotizacion | null;
  previousVenta: number | null;
  status: "loading" | "ready" | "error";
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

export default function QuoteCard({ icon, label, accent, data, previousVenta, status }: Props) {
  const variation =
    data && previousVenta !== null && previousVenta !== 0
      ? ((data.venta - previousVenta) / previousVenta) * 100
      : null;

  return (
    <section className="quoteCard" style={{ "--accent": accent } as CSSProperties}>
      <header className="quoteHeader">
        <h2 className="quoteTitle">
          {icon} {label}
        </h2>
      </header>

      <div className={`quoteBody quoteBody--${status}`}>
        {status === "loading" && !data && <span className="quoteLoading">Cargando…</span>}
        {status === "error" && !data && <span className="quoteError">No se pudo obtener el dato</span>}

        {data && (
          <>
            <div className="quotePrices">
              <div className="quotePriceBlock">
                <span className="quotePriceLabel">Compra</span>
                <span className="quotePriceValue">{currencyFormatter.format(data.compra)}</span>
              </div>
              <div className="quotePriceBlock quotePriceBlock--venta">
                <span className="quotePriceLabel">Venta</span>
                <span className="quotePriceValue quotePriceValue--accent">{currencyFormatter.format(data.venta)}</span>
              </div>
            </div>

            <div className="quoteMeta">
              {variation !== null && Math.abs(variation) > 0.001 && (
                <span className={`quoteVariation ${variation > 0 ? "up" : "down"}`}>
                  {variation > 0 ? "▲" : "▼"} {Math.abs(variation).toFixed(2)}%
                </span>
              )}
              <span className="quoteUpdated">
                Act. {timeFormatter.format(new Date(data.fechaActualizacion))}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
