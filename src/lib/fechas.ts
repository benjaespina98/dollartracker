// Toda la data de la app es argentina y se compara contra fechas de cierre
// argentinas. Usábamos new Date().toISOString() para saber qué día es hoy,
// pero eso es UTC: entre las 21:00 y la medianoche de acá (UTC-3) ya devolvía
// el día siguiente. Efecto concreto: a la noche, el "cierre anterior" pasaba a
// ser el cierre de hoy y la variación se iba a cero, así que el ▲/▼
// desaparecía de las tarjetas.
//
// en-CA formatea como YYYY-MM-DD, que es justo lo que necesitamos para
// comparar contra las fechas de las series.
const diaArgentino = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function hoyEnArgentina(): string {
  return diaArgentino.format(new Date());
}

/**
 * Último punto de la serie anterior a hoy. Es contra ese cierre que se calcula
 * la variación diaria, para que signifique lo mismo que la de las tarjetas de
 * mercado (que viene calculada por Twelve Data).
 */
export function cierreAnterior<T extends { fecha: string }>(
  serie: T[] | null,
  hoy: string = hoyEnArgentina()
): T | null {
  if (!serie) return null;
  return serie.filter((p) => p.fecha < hoy).at(-1) ?? null;
}
