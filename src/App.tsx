import "./App.css";
import QuoteCard from "./components/QuoteCard";
import { useCotizaciones } from "./useCotizaciones";

const CARDS = [
  { key: "oficial", icon: "🏦", label: "Oficial", accent: "#78beff" },
  { key: "blue", icon: "🟦", label: "Blue", accent: "#4ade80" },
  { key: "bolsa", icon: "📈", label: "MEP (Bolsa)", accent: "#c084fc" },
  { key: "contadoconliqui", icon: "🌎", label: "CCL", accent: "#f472b6" },
  { key: "cripto", icon: "₿", label: "Cripto", accent: "#f97316" },
  { key: "tarjeta", icon: "💳", label: "Tarjeta", accent: "#fb7185" },
  { key: "eur_oficial", icon: "💶", label: "Euro Oficial", accent: "#facc15" },
] as const;

export default function App() {
  const { state, refresh } = useCotizaciones();

  return (
    <div className="app">
      <header className="header">
        <div className="headerTop">
          <h1 className="title">
            Dollar Tracker <span className="titleIcon">💵</span>
          </h1>
          <button className="refreshAllBtn" onClick={() => refresh()} type="button">
            ↻ Actualizar
          </button>
        </div>

        <p className="subtitle">
          Cotizaciones del dólar y euro en Argentina, en tiempo real{" "}
          <span className="sourcePill" title="API pública de cotizaciones">
            fuente: DolarAPI
          </span>
        </p>
      </header>

      <main className="grid">
        {CARDS.map(({ key, icon, label, accent }) => (
          <QuoteCard
            key={key}
            icon={icon}
            label={label}
            accent={accent}
            data={state[key]?.data ?? null}
            previousVenta={state[key]?.previousVenta ?? null}
            status={state[key]?.status ?? "loading"}
          />
        ))}
      </main>

      <footer className="footer">
        <small className="footerNote">
          * Datos provistos por DolarAPI (dolarapi.com), actualizados automáticamente cada 5 minutos.
        </small>
      </footer>
    </div>
  );
}
