export interface Cotizacion {
  moneda: "USD" | "EUR" | "BRL";
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export interface QuoteCardConfig {
  key: string;
  icon: string;
  label: string;
  url: string;
}
