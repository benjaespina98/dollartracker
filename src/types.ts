export interface Cotizacion {
  moneda: "USD" | "EUR" | "BRL";
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export interface RiesgoPais {
  valor: number;
  fecha: string;
}

export interface MarketQuote {
  symbol: string;
  currency: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  marketTime: number | null;
}
