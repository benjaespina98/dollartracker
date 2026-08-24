import { useState } from "react";
import "./App.css";
import ConverterBar from "./components/ConverterBar";
import { CardInfoButton, CardInfoPanel } from "./components/ExpandedChrome";
import MarketCard from "./components/MarketCard";
import QuoteCard from "./components/QuoteCard";
import RiesgoPaisCard from "./components/RiesgoPaisCard";
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
  IconPulse,
  IconSoy,
  IconSwap,
  IconTrend,
  IconWheat,
} from "./components/icons";
import { parsearMonto, type MonedaOrigen } from "./conversion";
import { useCotizaciones } from "./useCotizaciones";
import { useHistoricoMercados } from "./useHistorico";
import { useMarketData } from "./useMarketData";
import { useTheme } from "./useTheme";

// Los títulos van cortos a propósito: la tarjeta mide ~190px en mobile y el
// header comparte ese ancho con el icono y el botón de compartir. El nombre
// completo va en `nombre`, que se muestra al pasar el mouse y lo leen los
// lectores de pantalla.
const CURRENCY_SECTIONS = [
  {
    title: "Dólar",
    cards: [
      { key: "oficial", label: "Oficial", nombre: "Dólar oficial", accent: "#4ade80", icon: <IconBank /> },
      { key: "blue", label: "Blue", nombre: "Dólar blue", accent: "#78beff", icon: <IconSwap /> },
      { key: "bolsa", label: "MEP", nombre: "Dólar MEP (Bolsa)", accent: "#c084fc", icon: <IconCandles /> },
      {
        key: "contadoconliqui",
        label: "CCL",
        nombre: "Dólar contado con liquidación",
        accent: "#f472b6",
        icon: <IconGlobe />,
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
const MERCADOS = [
  { key: "oil", label: "Petróleo", ticker: "USO", detalle: "Sigue al petróleo WTI", accent: "#a16207", icon: <IconDroplet /> },
  { key: "gold", label: "Oro", ticker: "GLD", detalle: "Sigue al oro spot", accent: "#eab308", icon: <IconIngot /> },
  { key: "spy", label: "S&P 500", ticker: "SPY", detalle: "Sigue al índice S&P 500", accent: "#38bdf8", icon: <IconTrend /> },
  { key: "dow", label: "Dow Jones", ticker: "DIA", detalle: "Sigue al Dow Jones Industrial Average", accent: "#818cf8", icon: <IconTrend /> },
  { key: "nasdaq", label: "Nasdaq", ticker: "QQQ", detalle: "Sigue al Nasdaq-100", accent: "#34d399", icon: <IconTrend /> },
];

const GRANOS = [
  { key: "soja", label: "Soja", ticker: "SOYB", detalle: "Sigue los futuros de soja de Chicago", accent: "#84cc16", icon: <IconSoy /> },
  { key: "maiz", label: "Maíz", ticker: "CORN", detalle: "Sigue los futuros de maíz de Chicago", accent: "#fbbf24", icon: <IconCorn /> },
  { key: "trigo", label: "Trigo", ticker: "WEAT", detalle: "Sigue los futuros de trigo de Chicago", accent: "#d97706", icon: <IconWheat /> },
];

export default function App() {
  const { state, refresh: refreshCotizaciones } = useCotizaciones();
  const { riesgoPais, markets, refresh: refreshMarkets } = useMarketData();
  const historicoMercados = useHistoricoMercados();
  const { theme, toggleTheme } = useTheme();

  // Guardamos el texto crudo que se tipeó (no el número) para no pelear con el
  // cursor mientras se escribe "1.234,5"; el parseo se hace acá una sola vez.
  const [montoTexto, setMontoTexto] = useState("");
  const [origen, setOrigen] = useState<MonedaOrigen>("ARS");
  const monto = parsearMonto(montoTexto);
  const [mostrarInfoApp, setMostrarInfoApp] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  // Antes el botón no daba ninguna señal: se tocaba, no pasaba nada visible
  // durante uno o dos segundos y la reacción natural era volver a tocarlo.
  async function refreshAll() {
    if (refrescando) return;
    setRefrescando(true);
    try {
      await Promise.all([refreshCotizaciones(), refreshMarkets()]);
    } finally {
      setRefrescando(false);
    }
  }

  function renderMercado({ key, label, ticker, detalle, accent, icon }: (typeof MERCADOS)[number]) {
    return (
      <MarketCard
        key={key}
        label={label}
        icon={icon}
        ticker={ticker}
        detalle={detalle}
        accent={accent}
        data={markets[key]?.data ?? null}
        status={markets[key]?.status ?? "loading"}
        historico={historicoMercados?.[key] ?? null}
      />
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="headerTop">
          <div className="brand">
            <span className="brandMark" aria-hidden="true">$</span>
            <div className="brandText">
              <h1 className="title">DollarTracker</h1>
              <p className="subtitle">Cotizaciones y mercados en tiempo real</p>
            </div>
          </div>

          <div className="headerActions">
            <CardInfoButton
              activo={mostrarInfoApp}
              onToggle={() => setMostrarInfoApp((v) => !v)}
              label="Acerca de DollarTracker"
            />

            <button
              className="themeToggleBtn"
              onClick={toggleTheme}
              type="button"
              aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
              title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
            >
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
                  />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path fill="currentColor" d="M20.5 14.6a8.5 8.5 0 1 1-11.1-11 7 7 0 0 0 11.1 11Z" />
                </svg>
              )}
            </button>

            <button
              className={`refreshAllBtn ${refrescando ? "refreshAllBtn--cargando" : ""}`}
              onClick={refreshAll}
              type="button"
              disabled={refrescando}
            >
              <svg
                className="refreshAllBtn__icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 11.5a8 8 0 1 0-.8 4.5"
                />
                <path
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 5v6.5h-6"
                />
              </svg>
              {refrescando ? "Actualizando" : "Actualizar"}
            </button>
          </div>
        </div>

        {mostrarInfoApp && (
          <CardInfoPanel>
            DollarTracker junta en un solo lugar las cotizaciones del dólar y otras monedas (DolarAPI), el
            riesgo país y sus históricos (ArgentinaDatos) y mercados internacionales (Twelve Data). Tocá
            cualquier tarjeta para ver su histórico. Los valores son de referencia y pueden diferir de los de
            tu entidad financiera: no opera ni recomienda inversiones. Sin cuentas ni backend propio, todo se
            calcula en tu dispositivo.
          </CardInfoPanel>
        )}
      </header>

      <h2 className="sectionTitle sectionTitle--converter">
        <span>Cotizador</span>
      </h2>
      <ConverterBar
        monto={montoTexto}
        origen={origen}
        onMontoChange={setMontoTexto}
        onOrigenChange={setOrigen}
      />

      {CURRENCY_SECTIONS.map((section) => (
        <section key={section.title} className="quoteSection">
          <h2 className="sectionTitle">
            <span>{section.title}</span>
          </h2>
          <div className="grid">
            {section.cards.map(({ key, label, nombre, accent, icon }) => (
              <QuoteCard
                key={key}
                casa={key}
                label={label}
                nombre={nombre}
                icon={icon}
                accent={accent}
                data={state[key]?.data ?? null}
                status={state[key]?.status ?? "loading"}
                monto={monto}
                origen={origen}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="quoteSection">
        <h2 className="sectionTitle">
          <span>Mercados</span>
        </h2>
        <div className="grid">
          <RiesgoPaisCard
            icon={<IconPulse />}
            accent="#ef4444"
            data={riesgoPais.data}
            status={riesgoPais.status}
          />
          {MERCADOS.map(renderMercado)}
        </div>
      </section>

      <section className="quoteSection">
        <h2 className="sectionTitle">
          <span>Granos</span>
        </h2>
        <div className="grid">{GRANOS.map(renderMercado)}</div>
      </section>

      <footer className="footer">
        <div className="footerBrand">
          <span className="footerBrand__mark" aria-hidden="true">$</span>
          <span className="footerBrand__name">
            DollarTracker<sup>™</sup>
          </span>
        </div>
        <p className="footerNote">
          Datos de DolarAPI, ArgentinaDatos y Twelve Data. Valores de referencia, no asesoramiento financiero.
        </p>
      </footer>
    </div>
  );
}
