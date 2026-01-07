import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <h1 className="title">
          Dollar Tracker <span className="titleIcon">💵</span>
        </h1>

        <p className="subtitle">
          PWA para seguimiento de cotizaciones{" "}
          <span className="sourcePill" title="Widgets embebidos de un tercero">
            fuente: DólarHoy
          </span>
        </p>
      </header>

      <main className="grid">
        <section className="quoteCard">
          <header className="quoteHeader">
            <h2 className="quoteTitle">🟦 Blue</h2>
          </header>
          <div className="quoteBody isLoaded" dangerouslySetInnerHTML={{ __html: `<div><iframe style="width:320px;height:260px;border-radius:10px;box-shadow:2px 4px 4px rgb(0 0 0 / 25%);display:flex;justify-content:center;border:1px solid #bcbcbc" src="https://dolarhoy.com/i/cotizaciones/dolar-blue" frameborder="0"></iframe></div>` }} />
        </section>

        <section className="quoteCard">
          <header className="quoteHeader">
            <h2 className="quoteTitle">🏦 Oficial</h2>
          </header>
          <div className="quoteBody isLoaded" dangerouslySetInnerHTML={{ __html: `<div><iframe style="width:320px;height:260px;border-radius:10px;box-shadow:2px 4px 4px rgb(0 0 0 / 25%);display:flex;justify-content:center;border:1px solid #bcbcbc" src="https://dolarhoy.com/i/cotizaciones/dolar-bancos-y-casas-de-cambio" frameborder="0"></iframe></div>` }} />
        </section>

        <section className="quoteCard">
          <header className="quoteHeader">
            <h2 className="quoteTitle">📈 MEP (Bolsa)</h2>
          </header>
          <div className="quoteBody isLoaded" dangerouslySetInnerHTML={{ __html: `<div><iframe style="width:320px;height:260px;border-radius:10px;box-shadow:2px 4px 4px rgb(0 0 0 / 25%);display:flex;justify-content:center;border:1px solid #bcbcbc" src="https://dolarhoy.com/i/cotizaciones/dolar-mep" frameborder="0"></iframe></div>` }} />
        </section>

        <section className="quoteCard">
          <header className="quoteHeader">
            <h2 className="quoteTitle">🌎 CCL</h2>
          </header>
          <div className="quoteBody isLoaded" dangerouslySetInnerHTML={{ __html: `<div><iframe style="width:320px;height:260px;border-radius:10px;box-shadow:2px 4px 4px rgb(0 0 0 / 25%);display:flex;justify-content:center;border:1px solid #bcbcbc" src="https://dolarhoy.com/i/cotizaciones/dolar-contado-con-liquidacion" frameborder="0"></iframe></div>` }} />
        </section>

        <section className="quoteCard">
          <header className="quoteHeader">
            <h2 className="quoteTitle">₿ Cripto (BTC/USD)</h2>
          </header>
          <div className="quoteBody isLoaded" dangerouslySetInnerHTML={{ __html: `<div><iframe style="width:320px;height:260px;border-radius:10px;box-shadow:2px 4px 4px rgb(0 0 0 / 25%);display:flex;justify-content:center;border:1px solid #bcbcbc" src="https://dolarhoy.com/i/cotizaciones/bitcoin-usd" frameborder="0"></iframe></div>` }} />
        </section>

        <section className="quoteCard">
          <header className="quoteHeader">
            <h2 className="quoteTitle">🇦🇷 Solidario (Banco Nación)</h2>
          </header>
          <div className="quoteBody isLoaded" dangerouslySetInnerHTML={{ __html: `<div><iframe style="width:320px;height:260px;border-radius:10px;box-shadow:2px 4px 4px rgb(0 0 0 / 25%);display:flex;justify-content:center;border:1px solid #bcbcbc" src="https://dolarhoy.com/i/cotizaciones/banco-nacion" frameborder="0"></iframe></div>` }} />
        </section>
      </main>

      <footer className="footer">
        <small className="footerNote">
          * Datos embebidos desde un proveedor externo. Pueden variar o no estar disponibles temporalmente.
        </small>
      </footer>
    </div>
  );
}
