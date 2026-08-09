import "./App.css";
import QuoteCard from "./components/QuoteCard";
import { useCotizaciones } from "./useCotizaciones";
import { useTheme } from "./useTheme";

const SECTIONS = [
  {
    title: "Dólar",
    cards: [
      { key: "oficial", label: "Oficial", accent: "#4ade80" },
      { key: "blue", label: "Blue", accent: "#78beff" },
      { key: "bolsa", label: "MEP (Bolsa)", accent: "#c084fc" },
      { key: "contadoconliqui", label: "CCL", accent: "#f472b6" },
      { key: "cripto", label: "Cripto", accent: "#f97316" },
      { key: "tarjeta", label: "Tarjeta", accent: "#fb7185" },
    ],
  },
  {
    title: "Otras monedas",
    cards: [
      { key: "eur_oficial", label: "Euro", accent: "#facc15" },
      { key: "brl_oficial", label: "Real Brasileño", accent: "#2dd4bf" },
    ],
  },
] as const;

export default function App() {
  const { state, refresh } = useCotizaciones();
  const { theme, toggleTheme } = useTheme();

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
                  <path
                    fill="currentColor"
                    d="M20.5 14.6a8.5 8.5 0 1 1-11.1-11 7 7 0 0 0 11.1 11Z"
                  />
                </svg>
              )}
            </button>

            <button className="refreshAllBtn" onClick={() => refresh()} type="button">
              <span className="refreshAllBtn__icon" aria-hidden="true">↻</span> Actualizar
            </button>
          </div>
        </div>

        <p className="subtitle">
          Cotizaciones del dólar, euro y real en Argentina, en tiempo real{" "}
          <span className="sourcePill" title="API pública de cotizaciones">
            fuente: DolarAPI
          </span>
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.title} className="quoteSection">
          <h2 className="sectionTitle">
            <span>{section.title}</span>
          </h2>
          <div className="grid">
            {section.cards.map(({ key, label, accent }) => (
              <QuoteCard
                key={key}
                label={label}
                accent={accent}
                data={state[key]?.data ?? null}
                previousVenta={state[key]?.previousVenta ?? null}
                status={state[key]?.status ?? "loading"}
              />
            ))}
          </div>
        </section>
      ))}

      <footer className="footer">
        <small className="footerNote">
          Esta página consulta DolarAPI (dolarapi.com) cada 5 minutos. "Act." indica cuándo la propia
          fuente actualizó ese valor por última vez, no cuándo lo viste vos — por eso Oficial y
          Mayorista suelen mostrar una hora más antigua que Blue o Cripto, que se mueven todo el día.
        </small>
      </footer>
    </div>
  );
}
