import { useState } from "react";
import "./App.css";
import QuoteFrame from "./components/QuoteFrame";

type Quote = { title: string; icon: string; src: string };

const quotes: Quote[] = [
  { title: "Blue", icon: "🟦", src: "https://dolarhoy.com/i/cotizaciones/dolar-blue" },
  {
    title: "Oficial",
    icon: "🏦",
    src: "https://dolarhoy.com/i/cotizaciones/dolar-bancos-y-casas-de-cambio",
  },
  { title: "MEP (Bolsa)", icon: "📈", src: "https://dolarhoy.com/i/cotizaciones/dolar-mep" },
  { title: "CCL", icon: "🌎", src: "https://dolarhoy.com/i/cotizaciones/dolar-contado-con-liquidacion" },
  { title: "Cripto (BTC/USD)", icon: "₿", src: "https://dolarhoy.com/i/cotizaciones/bitcoin-usd" },
  { title: "Solidario (Banco Nación)", icon: "🇦🇷", src: "https://dolarhoy.com/i/cotizaciones/banco-nacion" },
];

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefreshAll = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="headerTop">
          <h1 className="title">
            Dollar Tracker <span className="titleIcon">💵</span>
          </h1>
          <button
            className="refreshAllBtn"
            onClick={handleRefreshAll}
            title="Actualizar todas las cotizaciones"
          >
            🔄 Actualizar
          </button>
        </div>

        <p className="subtitle">
          PWA para seguimiento de cotizaciones{" "}
          <span className="sourcePill" title="Widgets embebidos de un tercero">
            fuente: DólarHoy
          </span>
        </p>
      </header>

      <main className="grid">
        {quotes.map((q) => (
          <QuoteFrame key={q.src} title={`${q.icon} ${q.title}`} src={q.src} refreshKey={refreshKey} />
        ))}
      </main>

      <footer className="footer">
        <small className="footerNote">
          * Datos embebidos desde un proveedor externo. Pueden variar o no estar disponibles temporalmente.
        </small>
      </footer>
    </div>
  );
}
