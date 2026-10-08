// Páginas por cotización (/dolar-blue, /dolar-mep…): la misma app, pero con una
// dirección, un título y un texto propios, que es lo que Google necesita para
// mostrar el sitio cuando alguien busca "dólar blue hoy". Archivo de datos puro
// (sin imports): lo leen la app, el build (vite.config.ts) y los tests.

export const SITIO = "https://dollartracker.vercel.app";

export interface PaginaMoneda {
  /** Ruta sin barras: "dolar-blue" → /dolar-blue */
  slug: string;
  /** Clave de la tarjeta que ilustra la página (casa del dólar, mercado o "riesgoPais") */
  clave: string;
  /** Nombre corto para los enlaces ("Dólar blue") */
  nombre: string;
  /** <title>: hasta ~60 caracteres para que Google no lo corte */
  titulo: string;
  /** meta description: hasta ~160 caracteres */
  descripcion: string;
  /** Título visible de la página */
  h1: string;
  /** Texto explicativo; sin cifras, porque las cifras cambian todos los días */
  parrafos: string[];
}

export const PAGINAS: PaginaMoneda[] = [
  {
    slug: "dolar-oficial",
    clave: "oficial",
    nombre: "Dólar oficial",
    titulo: "Dólar oficial hoy: cotización en vivo | DollarTracker",
    descripcion:
      "Cotización del dólar oficial hoy en Argentina: precio de compra y venta, variación del día y gráfico histórico. Sin registrarte.",
    h1: "Dólar oficial hoy",
    parrafos: [
      "El dólar oficial es el que se compra y se vende en bancos y casas de cambio autorizadas. Es la referencia para las operaciones formales de cambio.",
      "Acá ves el precio de compra y de venta actualizado, cuánto varió contra el día anterior y su evolución en el último año. Los valores son de referencia y pueden diferir de los que te ofrezca tu banco.",
    ],
  },
  {
    slug: "dolar-blue",
    clave: "blue",
    nombre: "Dólar blue",
    titulo: "Dólar blue hoy: cotización en vivo | DollarTracker",
    descripcion:
      "Cotización del dólar blue hoy en Argentina: compra, venta, brecha con el oficial y gráfico del último año. Datos actualizados, sin registrarte.",
    h1: "Dólar blue hoy",
    parrafos: [
      "El dólar blue es el que se opera fuera del mercado oficial de cambios, en el circuito informal. Su precio surge de la oferta y la demanda de ese mercado paralelo.",
      "La brecha indica cuánto más caro (o barato) sale respecto del dólar oficial. Acá ves el precio de compra y venta, la brecha y cómo evolucionó en el último año.",
    ],
  },
  {
    slug: "dolar-mep",
    clave: "bolsa",
    nombre: "Dólar MEP",
    titulo: "Dólar MEP (Bolsa) hoy: cotización en vivo | DollarTracker",
    descripcion:
      "Cotización del dólar MEP o Bolsa hoy en Argentina: compra, venta, brecha con el oficial y gráfico histórico. Actualizado, sin registrarte.",
    h1: "Dólar MEP (Bolsa) hoy",
    parrafos: [
      "El dólar MEP, también llamado dólar Bolsa, se consigue de forma legal comprando un bono o una acción en pesos y vendiéndolo en dólares a través de una sociedad de bolsa.",
      "Acá ves su cotización de compra y venta, la brecha con el dólar oficial y su evolución en el último año.",
    ],
  },
  {
    slug: "dolar-ccl",
    clave: "contadoconliqui",
    nombre: "Dólar CCL",
    titulo: "Dólar CCL hoy: contado con liqui en vivo | DollarTracker",
    descripcion:
      "Cotización del dólar contado con liquidación (CCL) hoy en Argentina: compra, venta, brecha con el oficial y gráfico histórico. Sin registrarte.",
    h1: "Dólar contado con liquidación (CCL) hoy",
    parrafos: [
      "El dólar contado con liquidación, o CCL, se obtiene de forma legal comprando un activo en pesos y vendiéndolo en el exterior en dólares, que quedan disponibles fuera del país.",
      "Acá ves su cotización de compra y venta, la brecha con el dólar oficial y su evolución en el último año.",
    ],
  },
  {
    slug: "dolar-cripto",
    clave: "cripto",
    nombre: "Dólar cripto",
    titulo: "Dólar cripto hoy: cotización en vivo | DollarTracker",
    descripcion:
      "Cotización del dólar cripto hoy en Argentina: precio de compra y venta y gráfico del último año. Datos actualizados, sin registrarte.",
    h1: "Dólar cripto hoy",
    parrafos: [
      "El dólar cripto es el precio del dólar que se obtiene operando con criptomonedas estables (stablecoins) en plataformas de intercambio.",
      "Acá ves el precio de compra y venta actualizado y cómo evolucionó en el último año.",
    ],
  },
  {
    slug: "dolar-tarjeta",
    clave: "tarjeta",
    nombre: "Dólar tarjeta",
    titulo: "Dólar tarjeta hoy: cotización en vivo | DollarTracker",
    descripcion:
      "Cotización del dólar tarjeta hoy en Argentina: el valor para consumos en el exterior y compras en dólares. Con gráfico histórico, sin registrarte.",
    h1: "Dólar tarjeta hoy",
    parrafos: [
      "El dólar tarjeta es el valor que se usa para los consumos en moneda extranjera con tarjeta de crédito o débito. Parte del dólar oficial e incluye los impuestos y percepciones vigentes.",
      "Acá ves su precio actualizado y su evolución en el último año. Es un valor de referencia: el que te cobre tu banco puede variar.",
    ],
  },
  {
    slug: "euro-hoy",
    clave: "eur_oficial",
    nombre: "Euro",
    titulo: "Euro hoy en Argentina: cotización oficial | DollarTracker",
    descripcion:
      "Cotización del euro oficial hoy en Argentina: precio de compra y venta en pesos, actualizado. Sin registrarte.",
    h1: "Euro hoy en Argentina",
    parrafos: [
      "Acá ves el precio de compra y de venta del euro oficial en pesos argentinos, actualizado a lo largo del día.",
      "Es un valor de referencia y puede diferir del que ofrezca tu banco o casa de cambio.",
    ],
  },
  {
    slug: "real-hoy",
    clave: "brl_oficial",
    nombre: "Real",
    titulo: "Real brasileño hoy: cotización oficial | DollarTracker",
    descripcion:
      "Cotización del real brasileño hoy en Argentina: precio de compra y venta en pesos, actualizado. Sin registrarte.",
    h1: "Real brasileño hoy",
    parrafos: [
      "Acá ves el precio de compra y de venta del real brasileño en pesos argentinos, actualizado a lo largo del día.",
      "Es un valor de referencia y puede diferir del que ofrezca tu banco o casa de cambio.",
    ],
  },
  {
    slug: "bitcoin-hoy",
    clave: "btc",
    nombre: "Bitcoin",
    titulo: "Precio de Bitcoin hoy en dólares | DollarTracker",
    descripcion:
      "Precio de Bitcoin (BTC) hoy en dólares, variación de las últimas 24 horas y gráfico del último año. Datos actualizados cada minuto.",
    h1: "Precio de Bitcoin hoy",
    parrafos: [
      "Bitcoin es la criptomoneda más conocida y se opera las 24 horas, todos los días. Acá ves su precio en dólares, cuánto varió en las últimas 24 horas y su evolución en el último año.",
      "El precio se toma del par BTC/USDT de Binance. No es asesoramiento financiero.",
    ],
  },
  {
    slug: "riesgo-pais",
    clave: "riesgoPais",
    nombre: "Riesgo país",
    titulo: "Riesgo país Argentina hoy: valor en vivo | DollarTracker",
    descripcion:
      "Riesgo país de Argentina hoy en puntos básicos, variación diaria y gráfico histórico. Datos actualizados, sin registrarte.",
    h1: "Riesgo país de Argentina hoy",
    parrafos: [
      "El riesgo país mide, en puntos básicos, el sobreprecio que pagan los bonos soberanos de Argentina frente a los del Tesoro de Estados Unidos. Un valor más alto indica que los inversores perciben más riesgo.",
      "Acá ves el valor más reciente, su variación contra el dato anterior y su evolución en el último año.",
    ],
  },
];

/** Busca la página que corresponde a una ruta del navegador ("/dolar-blue", "/dolar-blue/"…). */
export function paginaPorRuta(pathname: string): PaginaMoneda | null {
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  return PAGINAS.find((p) => p.slug === slug) ?? null;
}
