export type MonedaOrigen = "ARS" | "USD" | "EUR" | "BRL";

export const MONEDAS_ORIGEN: { codigo: MonedaOrigen; simbolo: string; nombre: string }[] = [
  { codigo: "ARS", simbolo: "$", nombre: "pesos" },
  { codigo: "USD", simbolo: "US$", nombre: "dólares" },
  { codigo: "EUR", simbolo: "€", nombre: "euros" },
  { codigo: "BRL", simbolo: "R$", nombre: "reales" },
];

// El usuario escribe en formato argentino: "50.000" o "1.234,56". Nos quedamos
// con dígitos, punto y coma; sacamos los puntos de miles y pasamos la coma
// decimal a punto para que Number() la entienda.
export function parsearMonto(texto: string): number | null {
  const limpio = texto.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  if (limpio === "") return null;
  const valor = Number(limpio);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

export interface Conversion {
  valor: number;
  moneda: string;
  /** Cotización usada, para poder mostrarla debajo del resultado */
  tasa: number;
  punta: "compra" | "venta";
}

/**
 * Convierte el monto tipeado según UNA cotización concreta (la de la tarjeta).
 *
 * Devuelve null cuando la tarjeta no aplica al origen elegido: si escribís
 * euros, una tarjeta de dólar no puede responder sin inventar una tasa cruzada
 * (habría que elegir arbitrariamente cuál de los seis dólares usar como puente
 * y el resultado pagaría dos spreads). En ese caso la tarjeta sigue mostrando
 * compra y venta, que es información honesta.
 */
export function convertir(
  monto: number,
  origen: MonedaOrigen,
  monedaTarjeta: string,
  compra: number,
  venta: number
): Conversion | null {
  // Pesos → moneda extranjera: la casa te vende, pagás el precio de venta
  if (origen === "ARS") {
    return venta > 0 ? { valor: monto / venta, moneda: monedaTarjeta, tasa: venta, punta: "venta" } : null;
  }

  // Moneda extranjera → pesos: la casa te compra, cobrás el precio de compra
  if (origen === monedaTarjeta) {
    return compra > 0 ? { valor: monto * compra, moneda: "ARS", tasa: compra, punta: "compra" } : null;
  }

  return null;
}

const montoFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// Se aplica al salir del campo, no mientras se escribe: reformatear en cada
// tecla mueve el cursor de lugar y es insoportable de usar.
export function formatearMontoTipeado(texto: string): string {
  const valor = parsearMonto(texto);
  return valor === null ? texto : montoFormatter.format(valor);
}

const formateadores = new Map<string, Intl.NumberFormat>();

export function formatearMoneda(valor: number, moneda: string): string {
  let formateador = formateadores.get(moneda);
  if (!formateador) {
    formateador = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: moneda,
      // narrowSymbol da "€" y "R$" en vez de "EUR" y "BRL", pero para el dólar
      // devolvería un "$" pelado que se confunde con pesos: ahí queremos "US$".
      currencyDisplay: moneda === "USD" ? "symbol" : "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formateadores.set(moneda, formateador);
  }
  return formateador.format(valor);
}
