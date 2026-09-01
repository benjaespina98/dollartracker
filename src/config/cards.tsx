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
  IconWheat,
} from "../components/icons";

export interface CurrencyCardConfig {
  key: string;
  label: string;
  nombre: string;
  accent: string;
  icon: ReactNode;
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
      { key: "oficial", label: "Oficial", nombre: "Dólar oficial", accent: "#4ade80", icon: <IconBank /> },
      {
        key: "blue",
        label: "Blue",
        nombre: "Dólar blue",
        accent: "#78beff",
        icon: <IconSwap />,
        // Contra qué se mide la brecha cambiaria del badge en la tarjeta.
        conBrecha: true,
      },
      {
        key: "bolsa",
        label: "MEP",
        nombre: "Dólar MEP (Bolsa)",
        accent: "#c084fc",
        icon: <IconCandles />,
        conBrecha: true,
      },
      {
        key: "contadoconliqui",
        label: "CCL",
        nombre: "Dólar contado con liquidación",
        accent: "#f472b6",
        icon: <IconGlobe />,
        conBrecha: true,
      },
      { key: "cripto", label: "Cripto", nombre: "Dólar cripto", accent: "#f97316", icon: <IconCrypto /> },
      { key: "tarjeta", label: "Tarjeta", nombre: "Dólar tarjeta", accent: "#fb7185", icon: <IconCard /> },
    ],
  },
  {
    title: "Otras monedas",
    cards: [
      { key: "eur_oficial", label: "Euro", nombre: "Euro oficial", accent: "#facc15", icon: <IconGlyph glyph="€" /> },
      {
        key: "brl_oficial",
        label: "Real",
        nombre: "Real brasileño",
        accent: "#2dd4bf",
        icon: <IconGlyph glyph="R$" />,
      },
    ],
  },
];

// Bajo el precio va solo el ticker del ETF: la frase completa ("sigue al
// petróleo WTI") era una leyenda repetida en las ocho tarjetas que en mobile
// no entraba. Ahora vive en el panel (i) de la tarjeta abierta.
export const MERCADOS = [
  { key: "oil", label: "Petróleo", ticker: "USO", detalle: "Sigue al petróleo WTI", accent: "#a16207", icon: <IconDroplet /> },
  { key: "gold", label: "Oro", ticker: "GLD", detalle: "Sigue al oro spot", accent: "#eab308", icon: <IconIngot /> },
  { key: "spy", label: "S&P 500", ticker: "SPY", detalle: "Sigue al índice S&P 500", accent: "#38bdf8", icon: <IconTrend /> },
  { key: "dow", label: "Dow Jones", ticker: "DIA", detalle: "Sigue al Dow Jones Industrial Average", accent: "#818cf8", icon: <IconTrend /> },
  { key: "nasdaq", label: "Nasdaq", ticker: "QQQ", detalle: "Sigue al Nasdaq-100", accent: "#34d399", icon: <IconTrend /> },
];

export const GRANOS = [
  { key: "soja", label: "Soja", ticker: "SOYB", detalle: "Sigue los futuros de soja de Chicago", accent: "#84cc16", icon: <IconSoy /> },
  { key: "maiz", label: "Maíz", ticker: "CORN", detalle: "Sigue los futuros de maíz de Chicago", accent: "#fbbf24", icon: <IconCorn /> },
  { key: "trigo", label: "Trigo", ticker: "WEAT", detalle: "Sigue los futuros de trigo de Chicago", accent: "#d97706", icon: <IconWheat /> },
];
