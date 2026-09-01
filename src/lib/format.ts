// Formateadores compartidos por las tarjetas. Antes cada componente declaraba
// los suyos (tres copias de currencyFormatter, timeFormatter y
// fullDateFormatter), con el riesgo de que se fueran separando entre sí.

export const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const dolares = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const entero = new Intl.NumberFormat("es-AR");

const hora = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const diaMes = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" });

const fechaHora = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const formatearHora = (fecha: Date) => hora.format(fecha);
export const formatearDiaMes = (fecha: Date) => diaMes.format(fecha);
export const formatearFechaHora = (fecha: Date) => fechaHora.format(fecha);

/** Una fecha YYYY-MM-DD al mediodía, para que el desfasaje UTC no la corra un día */
export const fechaDelDia = (iso: string) => new Date(`${iso}T12:00:00`);

/**
 * "hace 3 min" / "hace 2 h" — cuánto hace que se guardó un dato en el cache
 * local. Se usa junto al OfflineTag: la fecha del dato dice cuándo lo publicó
 * la fuente, esto dice desde cuándo lo tenemos guardado en este dispositivo.
 */
export function formatearHaceTiempo(savedAt: number, ahora: number = Date.now()): string {
  const minutos = Math.round((ahora - savedAt) / 60_000);
  if (minutos < 1) return "hace instantes";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return `hace ${dias} d`;
}
