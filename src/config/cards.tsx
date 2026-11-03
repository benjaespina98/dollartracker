import type { ReactNode } from "react";
import {
  IconBank,
  IconCandles,
  IconCard,
  IconCorn,
  IconCrypto,
  IconDroplet,
  IconGlobe,
  IconGlyph,
  IconIngot,
  IconSoy,
  IconSwap,
  IconTrend,
} from "../components/icons";
import { InfoFicha } from "../components/InfoFicha";

export interface CurrencyCardConfig {
  key: string;
  label: string;
  nombre: string;
  accent: string;
  icon: ReactNode;
  /** Qué representa esta cotización (metodología/mercado), específico de cada casa */
  descripcion: ReactNode;
  /** Si se muestra el badge de brecha cambiaria contra el dólar oficial */
  conBrecha?: boolean;
}

interface CurrencySection {
  title: string;
  cards: CurrencyCardConfig[];
}

// Los títulos van cortos a propósito: la tarjeta mide ~190px en mobile y el
// header comparte ese ancho con el icono y el botón de compartir. El nombre
// completo va en `nombre`, que se muestra al pasar el mouse y lo leen los
// lectores de pantalla.
export const CURRENCY_SECTIONS: CurrencySection[] = [
  {
    title: "Dólar",
    cards: [
      {
        key: "oficial",
        label: "Oficial",
        nombre: "Dólar oficial",
        accent: "#4ade80",
        icon: <IconBank />,
        descripcion:
          "Tipo de cambio minorista informado por entidades bancarias y casas de cambio autorizadas, de referencia para operaciones en pesos dentro del circuito formal.",
      },
      {
        key: "blue",
        label: "Blue",
        nombre: "Dólar blue",
        accent: "#78beff",
        icon: <IconSwap />,
        descripcion:
          "Cotización del mercado informal, extrabancario, determinada por oferta y demanda fuera del circuito cambiario regulado.",
        // Contra qué se mide la brecha cambiaria del badge en la tarjeta.
        conBrecha: true,
      },
      {
        key: "bolsa",
        label: "MEP",
        nombre: "Dólar MEP (Bolsa)",
        accent: "#c084fc",
        icon: <IconCandles />,
        descripcion:
          "Tipo de cambio implícito (dólar Bolsa) que resulta de comprar y vender un mismo título en pesos y en dólares dentro del mercado de capitales local.",
        conBrecha: true,
      },
      {
        key: "contadoconliqui",
        label: "CCL",
        nombre: "Dólar contado con liquidación",
        accent: "#f472b6",
        icon: <IconGlobe />,
        descripcion:
          "Tipo de cambio implícito que surge de comprar un activo en pesos en el mercado local y venderlo en dólares en un mercado del exterior.",
        conBrecha: true,
      },
      {
        key: "cripto",
        label: "Cripto",
        nombre: "Dólar cripto",
        accent: "#f97316",
        icon: <IconCrypto />,
        descripcion:
          "Tipo de cambio implícito obtenido mediante la compra y venta de criptoactivos, habitualmente stablecoins, entre pesos y dólares en exchanges.",
      },
      {
        key: "tarjeta",
        label: "Tarjeta",
        nombre: "Dólar tarjeta",
        accent: "#fb7185",
        icon: <IconCard />,
        descripcion:
          "Tipo de cambio aplicable a consumos en moneda extranjera con tarjeta de crédito o débito: dólar oficial más impuestos y percepciones vigentes.",
      },
    ],
  },
  {
    title: "Otras monedas",
    cards: [
      {
        key: "eur_oficial",
        label: "Euro",
        nombre: "Euro oficial",
        accent: "#facc15",
        icon: <IconGlyph glyph="€" />,
        descripcion: "Tipo de cambio minorista de referencia entre el euro y el peso argentino.",
      },
      {
        key: "brl_oficial",
        label: "Real",
        nombre: "Real brasileño",
        accent: "#2dd4bf",
        icon: <IconGlyph glyph="R$" />,
        descripcion: "Tipo de cambio minorista de referencia entre el real brasileño y el peso argentino.",
      },
    ],
  },
];

export interface MarketCardConfig {
  key: string;
  label: string;
  ticker: string;
  detalle: string;
  accent: string;
  icon: ReactNode;
  /** Par de Binance (por ejemplo BTCUSDT). Si está, el precio sale de Binance y no de Twelve Data */
  binance?: string;
  /** Panel de información del instrumento: descripción, fuente y aclaraciones propias */
  info: ReactNode;
  /** Texto propio del tooltip de la variación; si falta, "contra el cierre anterior" */
  variacionTitle?: string;
}

// Bajo el precio va solo el ticker del ETF: la frase completa ("sigue al
// petróleo WTI") era una leyenda repetida en las ocho tarjetas que en mobile
// no entraba. Ahora vive en el panel (i) de la tarjeta abierta.
export const MERCADOS: MarketCardConfig[] = [
  {
    key: "oil",
    label: "Petróleo WTI",
    ticker: "USO",
    detalle: "Petróleo crudo WTI, a través del ETF USO",
    accent: "#a16207",
    icon: <IconDroplet />,
    info: (
      <>
        <p>
          United States Oil Fund (USO) es un ETF que busca replicar el comportamiento del precio spot del petróleo
          crudo West Texas Intermediate (WTI) mediante contratos de futuros.
        </p>
        <p>El uso de futuros puede generar diferencias (roll yield) respecto del precio spot a lo largo del tiempo.</p>
        <InfoFicha fuente="Twelve Data" referencia="USO" referenciaLabel="Ticker" subyacente="Petróleo WTI" moneda="USD" />
      </>
    ),
  },
  {
    key: "gold",
    label: "Oro spot",
    ticker: "PAXG/USDT",
    detalle: "Oro spot, a través del token PAXG",
    accent: "#eab308",
    icon: <IconIngot />,
    binance: "PAXGUSDT",
    info: (
      <>
        <p>
          PAXG (Pax Gold) es un token emitido por Paxos Trust Company, respaldado 1:1 por oro físico en custodia: una
          onza troy por token.
        </p>
        <p>
          Su cotización en el mercado de criptoactivos sigue de cerca el precio internacional del oro, con una
          variación residual por la prima o el descuento del token respecto del metal subyacente.
        </p>
        <InfoFicha fuente="Binance" referencia="PAXG/USDT" subyacente="Oro (onza troy)" moneda="USD" />
      </>
    ),
    variacionTitle: "Variación de las últimas 24 horas",
  },
  {
    key: "spy",
    label: "S&P 500",
    ticker: "SPY",
    detalle: "Índice S&P 500, a través del ETF SPY",
    accent: "#38bdf8",
    icon: <IconTrend />,
    info: (
      <>
        <p>
          SPDR S&amp;P 500 ETF Trust (SPY) replica la composición y el rendimiento del índice S&amp;P 500, integrado
          por 500 de las principales empresas que cotizan en bolsas de Estados Unidos.
        </p>
        <InfoFicha fuente="Twelve Data" referencia="SPY" referenciaLabel="Ticker" subyacente="Índice S&P 500" moneda="USD" />
      </>
    ),
  },
  {
    key: "dow",
    label: "Dow Jones",
    ticker: "DIA",
    detalle: "Índice Dow Jones Industrial Average, a través del ETF DIA",
    accent: "#818cf8",
    icon: <IconTrend />,
    info: (
      <>
        <p>
          SPDR Dow Jones Industrial Average ETF Trust (DIA) replica el índice Dow Jones Industrial Average, integrado
          por 30 empresas industriales líderes de Estados Unidos.
        </p>
        <InfoFicha fuente="Twelve Data" referencia="DIA" referenciaLabel="Ticker" subyacente="Dow Jones Industrial Average" moneda="USD" />
      </>
    ),
  },
  {
    key: "nasdaq",
    label: "Nasdaq",
    ticker: "QQQ",
    detalle: "Índice Nasdaq-100, a través del ETF QQQ",
    accent: "#34d399",
    icon: <IconTrend />,
    info: (
      <>
        <p>
          Invesco QQQ Trust (QQQ) replica el índice Nasdaq-100, integrado por las 100 principales empresas no
          financieras que cotizan en el Nasdaq.
        </p>
        <InfoFicha fuente="Twelve Data" referencia="QQQ" referenciaLabel="Ticker" subyacente="Nasdaq-100" moneda="USD" />
      </>
    ),
  },
  {
    key: "brasil",
    label: "Ibovespa",
    ticker: "EWZ",
    detalle: "Índice Ibovespa (bolsa de San Pablo), a través del ETF EWZ",
    accent: "#22c55e",
    icon: <IconTrend />,
    info: (
      <>
        <p>
          iShares MSCI Brazil ETF (EWZ) replica el índice MSCI Brazil, integrado por las principales empresas
          brasileñas que cotizan en la bolsa de San Pablo (B3).
        </p>
        <p>
          Se utiliza como aproximación del Ibovespa: comparten mercado y composición en gran medida, pero difieren en
          metodología de índice, por lo que su evolución puede no ser idéntica.
        </p>
        <InfoFicha fuente="Twelve Data" referencia="EWZ" referenciaLabel="Ticker" subyacente="Índice MSCI Brazil (proxy del Ibovespa)" moneda="USD" />
      </>
    ),
  },
  {
    key: "argentina",
    label: "Merval",
    ticker: "ARGT",
    detalle: "Índice S&P Merval (bolsa de Buenos Aires), a través del ETF ARGT",
    accent: "#60a5fa",
    icon: <IconTrend />,
    info: (
      <>
        <p>
          Global X MSCI Argentina ETF (ARGT) agrupa empresas argentinas y con exposición significativa a Argentina
          que cotizan en bolsas del exterior.
        </p>
        <p>
          Se utiliza como aproximación del S&amp;P Merval: la composición y la metodología de índice difieren, por lo
          que su evolución puede no ser idéntica.
        </p>
        <InfoFicha fuente="Twelve Data" referencia="ARGT" referenciaLabel="Ticker" subyacente="Índice MSCI Argentina (proxy del Merval)" moneda="USD" />
      </>
    ),
  },
];

export const GRANOS: MarketCardConfig[] = [
  {
    key: "soja",
    label: "Soja",
    ticker: "SOYB",
    detalle: "Soja (futuros CBOT Chicago), a través del ETF SOYB",
    accent: "#84cc16",
    icon: <IconSoy />,
    info: (
      <>
        <p>
          Teucrium Soybean Fund (SOYB) busca replicar el comportamiento de los futuros de soja negociados en el
          Chicago Board of Trade (CBOT), mediante una cartera de contratos de distintos vencimientos.
        </p>
        <p>El uso de futuros puede generar diferencias (roll yield) respecto del precio spot a lo largo del tiempo.</p>
        <InfoFicha fuente="Twelve Data" referencia="SOYB" referenciaLabel="Ticker" subyacente="Futuros de soja (CBOT)" moneda="USD" />
      </>
    ),
  },
  {
    key: "maiz",
    label: "Maíz",
    ticker: "CORN",
    detalle: "Maíz (futuros CBOT Chicago), a través del ETF CORN",
    accent: "#fbbf24",
    icon: <IconCorn />,
    info: (
      <>
        <p>
          Teucrium Corn Fund (CORN) busca replicar el comportamiento de los futuros de maíz negociados en el Chicago
          Board of Trade (CBOT), mediante una cartera de contratos de distintos vencimientos.
        </p>
        <p>El uso de futuros puede generar diferencias (roll yield) respecto del precio spot a lo largo del tiempo.</p>
        <InfoFicha fuente="Twelve Data" referencia="CORN" referenciaLabel="Ticker" subyacente="Futuros de maíz (CBOT)" moneda="USD" />
      </>
    ),
  },
];

// Trigo (WEAT) se sacó de Mercados/Granos: el plan gratuito de Twelve Data
// permite 8 créditos por minuto y cada símbolo nuevo de esta lista consume
// uno. Con los 9 que había (al sumar Ibovespa y Merval), el cupo se excedía
// en cada actualización y Mercados entero quedaba fallando de forma
// intermitente — visto en producción el 2026-11-03. Volver a 8 lo soluciona.
// Si se suma otro instrumento de Twelve Data, hay que sacar uno de acá.

// Cripto y oro no son ETF ni salen de Twelve Data: vienen de Binance, y su
// variación es la de las últimas 24 horas porque no tienen cierre diario.
export const CRIPTO: MarketCardConfig[] = [
  {
    key: "btc",
    label: "BTC",
    ticker: "BTC/USDT",
    detalle: "Bitcoin en dólares, par BTC/USDT",
    accent: "#f7931a",
    icon: <IconGlyph glyph="₿" />,
    binance: "BTCUSDT",
    info: (
      <>
        <p>
          Bitcoin (BTC) es un activo digital descentralizado, sin respaldo en activos físicos ni emisor central,
          registrado en una red de cómputo distribuida (blockchain).
        </p>
        <p>La cotización mostrada es su precio de mercado frente al dólar, vía la stablecoin USDT.</p>
        <InfoFicha fuente="Binance" referencia="BTC/USDT" moneda="USD" />
      </>
    ),
    variacionTitle: "Variación de las últimas 24 horas",
  },
  {
    key: "eth",
    label: "ETH",
    ticker: "ETH/USDT",
    detalle: "Ethereum en dólares, par ETH/USDT",
    accent: "#818cf8",
    icon: <IconGlyph glyph="Ξ" />,
    binance: "ETHUSDT",
    info: (
      <>
        <p>
          Ether (ETH) es el activo nativo de Ethereum, una red de cómputo distribuida que permite la ejecución de
          contratos inteligentes.
        </p>
        <p>La cotización mostrada es su precio de mercado frente al dólar, vía la stablecoin USDT.</p>
        <InfoFicha fuente="Binance" referencia="ETH/USDT" moneda="USD" />
      </>
    ),
    variacionTitle: "Variación de las últimas 24 horas",
  },
  {
    key: "sol",
    label: "SOL",
    ticker: "SOL/USDT",
    detalle: "Solana en dólares, par SOL/USDT",
    accent: "#14f195",
    icon: <IconGlyph glyph="◎" />,
    binance: "SOLUSDT",
    info: (
      <>
        <p>
          SOL es el activo nativo de Solana, una red de cómputo distribuida orientada a alto rendimiento de
          transacciones y contratos inteligentes.
        </p>
        <p>La cotización mostrada es su precio de mercado frente al dólar, vía la stablecoin USDT.</p>
        <InfoFicha fuente="Binance" referencia="SOL/USDT" moneda="USD" />
      </>
    ),
    variacionTitle: "Variación de las últimas 24 horas",
  },
  {
    key: "xrp",
    label: "XRP",
    ticker: "XRP/USDT",
    detalle: "XRP en dólares, par XRP/USDT",
    accent: "#cbd5e1",
    icon: <IconGlyph glyph="✕" />,
    binance: "XRPUSDT",
    info: (
      <>
        <p>XRP es el activo nativo de XRP Ledger, una red de cómputo distribuida orientada a la liquidación de pagos.</p>
        <p>La cotización mostrada es su precio de mercado frente al dólar, vía la stablecoin USDT.</p>
        <InfoFicha fuente="Binance" referencia="XRP/USDT" moneda="USD" />
      </>
    ),
    variacionTitle: "Variación de las últimas 24 horas",
  },
];

// USDC se sacó de Cripto: es una stablecoin que siempre vale ~1 dólar, así que
// mostrarla como cotización no aporta información útil (pedido explícito).
