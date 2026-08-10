export interface Cotizacion {
  moneda: "USD" | "EUR" | "BRL";
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

// Un día de la serie histórica de ArgentinaDatos (un punto por día hábil)
export interface HistoricoPunto {
  fecha: string;
  compra: number;
  venta: number;
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
