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

// El ticker del ETF va en la línea de abajo, no en el título: en mobile la
// tarjeta mide ~190px y "Dow Jones (DIA)" no entraba en una línea.
const MARKET_CARDS = [
  { key: "oil", label: "Petróleo", unit: "ETF USO · sigue al WTI", accent: "#a16207", icon: <IconDroplet /> },
  { key: "gold", label: "Oro", unit: "ETF GLD · sigue al oro spot", accent: "#eab308", icon: <IconIngot /> },
  { key: "spy", label: "S&P 500", unit: "ETF SPY", accent: "#38bdf8", icon: <IconTrend /> },
  { key: "dow", label: "Dow Jones", unit: "ETF DIA", accent: "#818cf8", icon: <IconTrend /> },
  { key: "nasdaq", label: "Nasdaq", unit: "ETF QQQ", accent: "#34d399", icon: <IconTrend /> },
];

const GRANOS_CARDS = [
  { key: "soja", label: "Soja", unit: "ETF SOYB · futuros Chicago", accent: "#84cc16", icon: <IconSoy /> },
  { key: "maiz", label: "Maíz", unit: "ETF CORN · futuros Chicago", accent: "#fbbf24", icon: <IconCorn /> },
  { key: "trigo", label: "Trigo", unit: "ETF WEAT · futuros Chicago", accent: "#d97706", icon: <IconWheat /> },
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
  const [mostrarInfoConversor, setMostrarInfoConversor] = useState(false);

  function refreshAll() {
    refreshCotizaciones();
    refreshMarkets();
  }

  return (
    <div className="app">
      <header className="header">
        <div className="headerTop">
          <div className="brand">
            <span className="brandMark" aria-hidden="true">$</span>
            <h1 className="title">DollarTracker</h1>
          </div>

          <div className="headerActions">
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

            <button className="refreshAllBtn" onClick={refreshAll} type="button">
              <span className="refreshAllBtn__icon" aria-hidden="true">↻</span> Actualizar
            </button>
          </div>
        </div>

        <div className="subtitleRow">
          <p className="subtitle">Cotizaciones y mercados en tiempo real.</p>
          <CardInfoButton
            activo={mostrarInfoApp}
            onToggle={() => setMostrarInfoApp((v) => !v)}
            label="Acerca de DollarTracker"
          />
        </div>
        {mostrarInfoApp && (
          <CardInfoPanel>
            DollarTracker junta en un solo lugar las cotizaciones del dólar y otras monedas (DolarAPI), el
            riesgo país y sus históricos (ArgentinaDatos) y mercados internacionales (Twelve Data). No opera ni
            recomienda inversiones: es solo un panel de referencia informativo, sin login ni backend propio —
            todo se calcula en tu dispositivo.
          </CardInfoPanel>
        )}
      </header>

      <div className="converterHeader">
        <h2 className="converterTitle">Cotizador</h2>
        <CardInfoButton
          activo={mostrarInfoConversor}
          onToggle={() => setMostrarInfoConversor((v) => !v)}
          label="Cómo funciona el cotizador"
        />
      </div>
      <ConverterBar
        monto={montoTexto}
        origen={origen}
        onMontoChange={setMontoTexto}
        onOrigenChange={setOrigen}
      />
      {mostrarInfoConversor && (
        <CardInfoPanel>
          Escribí un monto y elegí en qué moneda lo tenés: cada tarjeta va a mostrar cuánto te da a esa
          cotización, usando la punta de compra o de venta según corresponda. Es el mismo cálculo que harías
          vos con la calculadora, aplicado a todas las cotizaciones a la vez.
        </CardInfoPanel>
      )}

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
                previousVenta={state[key]?.previousVenta ?? null}
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
            previousValor={riesgoPais.previousValor}
            status={riesgoPais.status}
          />
          {MARKET_CARDS.map(({ key, label, unit, accent, icon }) => (
            <MarketCard
              key={key}
              label={label}
              icon={icon}
              unit={unit}
              accent={accent}
              data={markets[key]?.data ?? null}
              status={markets[key]?.status ?? "loading"}
              historico={historicoMercados?.[key] ?? null}
            />
          ))}
        </div>
      </section>

      <section className="quoteSection">
        <h2 className="sectionTitle">
          <span>Granos</span>
        </h2>
        <div className="grid">
          {GRANOS_CARDS.map(({ key, label, unit, accent, icon }) => (
            <MarketCard
              key={key}
              label={label}
              icon={icon}
              unit={unit}
              accent={accent}
              data={markets[key]?.data ?? null}
              status={markets[key]?.status ?? "loading"}
              historico={historicoMercados?.[key] ?? null}
            />
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footerBrand">
          <span className="footerBrand__mark" aria-hidden="true">$</span>
          <span className="footerBrand__name">
            DollarTracker<sup>™</sup>
          </span>
        </div>
        <p className="footerNote">
          Fuentes de datos: DolarAPI (cotizaciones), ArgentinaDatos (riesgo país e históricos) y Twelve Data
          (mercados internacionales). Los valores son de referencia y pueden diferir de los de tu entidad
          financiera; nada de lo aquí publicado constituye asesoramiento financiero.
        </p>
        <p className="footerNote footerNote--muted">
          "Actualizado a las" indica cuándo la fuente publicó ese valor, no el momento en que abriste la app.
          Sin cuentas, sin backend propio: todos los cálculos se hacen en tu dispositivo.
        </p>
      </footer>
    </div>
  );
}
