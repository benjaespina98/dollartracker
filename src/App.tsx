import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import CompartirResumenButton from "./components/CompartirResumenButton";
import ConverterBar from "./components/ConverterBar";
import { CardInfoButton, CardInfoPanel } from "./components/ExpandedChrome";
import { BrandMark, IconPulse, IconRefresh, IconSwap } from "./components/icons";
import MarketCard from "./components/MarketCard";
import NetworkBanner from "./components/NetworkBanner";
import PaginaIntro, { type ValorDePagina } from "./components/PaginaIntro";
import QuoteCard from "./components/QuoteCard";
import RiesgoPaisCard from "./components/RiesgoPaisCard";
import Seccion from "./components/Seccion";
import Toaster from "./components/Toaster";
import { PAGINAS, SITIO, paginaPorRuta, type PaginaMoneda } from "./config/paginas";
import { CRIPTO, CURRENCY_SECTIONS, GRANOS, MERCADOS, type CurrencyCardConfig, type MarketCardConfig } from "./config/cards";
import { useBitcoin } from "./hooks/useBitcoin";
import { useCotizaciones } from "./hooks/useCotizaciones";
import { useDismiss } from "./hooks/useDismiss";
import { useFavoritos } from "./hooks/useFavoritos";
import { useHistoricoBitcoin, useHistoricoMercados } from "./hooks/useHistorico";
import { useMarketData } from "./hooks/useMarketData";
import { parsearMonto, type MonedaOrigen } from "./lib/conversion";
import { dolares, entero, pesos } from "./lib/format";
import { prepararResumen } from "./lib/resumenImagen";

// Un solo lugar para ir de "clave de favorito" (casa, key de mercado/grano, o
// el literal "riesgoPais") a su configuración estática, sin repetir el
// .find/.get en cada lugar que necesita renderizar una tarjeta por su clave.
const MONEDA_POR_KEY = new Map<string, CurrencyCardConfig>(
  CURRENCY_SECTIONS.flatMap((seccion) => seccion.cards).map((c) => [c.key, c])
);
// El rojo de la tarjeta de Riesgo País; lo usan la tarjeta y el encabezado de su página.
const RIESGO_PAIS_ACENTO = "#f87171";
const MERCADO_POR_KEY = new Map<string, MarketCardConfig>([...MERCADOS, ...GRANOS, ...CRIPTO].map((m) => [m.key, m]));

export default function App() {
  const { state, refresh: refreshCotizaciones } = useCotizaciones();
  const { riesgoPais, markets, refresh: refreshMarkets } = useMarketData();
  const historicoMercados = useHistoricoMercados();
  const bitcoin = useBitcoin();
  // /dolar-blue, /dolar-mep…: la misma app con un título y un texto propios. La
  // ruta se lee una sola vez; navegar entre páginas recarga el documento.
  const [pagina] = useState<PaginaMoneda | null>(() => paginaPorRuta(window.location.pathname));
  const historicoBitcoin = useHistoricoBitcoin();
  const { favoritos, esFavorito, toggleFavorito, mover } = useFavoritos();

  // Guardamos el texto crudo que se tipeó (no el número) para no pelear con el
  // cursor mientras se escribe "1.234,5"; el parseo se hace acá una sola vez.
  const [montoTexto, setMontoTexto] = useState("");
  const [origen, setOrigen] = useState<MonedaOrigen>("ARS");
  const monto = parsearMonto(montoTexto);
  // El cotizador vive plegado en la sección Dólar y se abre a pedido. Al
  // cerrarlo se borra el monto: si no, las tarjetas seguirían mostrando una
  // conversión sin que se vea de dónde sale.
  const [mostrarConversor, setMostrarConversor] = useState(false);
  const alternarConversor = () => {
    if (mostrarConversor) setMontoTexto("");
    setMostrarConversor(!mostrarConversor);
  };
  const [mostrarInfoApp, setMostrarInfoApp] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  // El "Acerca de" del header se cierra tocando afuera del header o con Escape.
  const headerRef = useRef<HTMLElement | null>(null);
  const cerrarInfoApp = useCallback(() => setMostrarInfoApp(false), []);
  useDismiss(mostrarInfoApp, headerRef, cerrarInfoApp);

  // El HTML de la página ya trae su título, pero un service worker puede
  // servir el de la home: acá se corrige del lado del cliente.
  useEffect(() => {
    if (!pagina) return;
    document.title = pagina.titulo;
    document.querySelector('meta[name="description"]')?.setAttribute("content", pagina.descripcion);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `${SITIO}/${pagina.slug}`);
  }, [pagina]);

  // Base de la brecha cambiaria (blue/MEP/CCL contra el oficial). Si el
  // oficial todavía no llegó o vale 0, ninguna tarjeta muestra el badge.
  const ventaOficial = state.oficial?.data?.venta ?? null;

  // dibujarResumen recién lee esto al tocar "Resumen", pero recalcularlo acá
  // en cada refresco de cotizaciones (y no en cada tecla del conversor, que no
  // lo toca) es barato y evita rearmarlo desde cero en el click.
  const resumenDatos = useMemo(
    () => prepararResumen(state, riesgoPais.data),
    [state, riesgoPais.data]
  );

  // Antes el botón no daba ninguna señal: se tocaba, no pasaba nada visible
  // durante uno o dos segundos y la reacción natural era volver a tocarlo.
  async function refreshAll() {
    if (refrescando) return;
    setRefrescando(true);
    try {
      await Promise.all([refreshCotizaciones(), refreshMarkets(), bitcoin.refresh()]);
    } finally {
      setRefrescando(false);
    }
  }

  function renderMercado({ key, label, ticker, detalle, accent, icon, info, variacionTitle }: MarketCardConfig) {
    // Bitcoin no viaja con los demás mercados (otra fuente, otra cadencia).
    const entry = key === "btc" ? bitcoin : markets[key];
    const historico = key === "btc" ? historicoBitcoin : (historicoMercados?.[key] ?? null);

    return (
      <MarketCard
        key={key}
        label={label}
        icon={icon}
        ticker={ticker}
        detalle={detalle}
        accent={accent}
        info={info}
        variacionTitle={variacionTitle}
        data={entry?.data ?? null}
        status={entry?.status ?? "loading"}
        savedAt={entry?.savedAt ?? null}
        historico={historico}
        favorito={esFavorito(key)}
        onToggleFavorito={() => toggleFavorito(key)}
      />
    );
  }

  function renderMoneda({ key, label, nombre, accent, icon, conBrecha }: CurrencyCardConfig) {
    const ventaCasa = state[key]?.data?.venta ?? null;
    const brecha =
      conBrecha && ventaOficial && ventaCasa ? ((ventaCasa - ventaOficial) / ventaOficial) * 100 : null;

    return (
      <QuoteCard
        key={key}
        casa={key}
        label={label}
        nombre={nombre}
        icon={icon}
        accent={accent}
        data={state[key]?.data ?? null}
        status={state[key]?.status ?? "loading"}
        savedAt={state[key]?.savedAt ?? null}
        monto={monto}
        origen={origen}
        brecha={brecha}
        favorito={esFavorito(key)}
        onToggleFavorito={() => toggleFavorito(key)}
      />
    );
  }

  function renderRiesgoPais() {
    return (
      <RiesgoPaisCard
        key="riesgoPais"
        icon={<IconPulse />}
        accent={RIESGO_PAIS_ACENTO}
        data={riesgoPais.data}
        status={riesgoPais.status}
        savedAt={riesgoPais.savedAt}
        favorito={esFavorito("riesgoPais")}
        onToggleFavorito={() => toggleFavorito("riesgoPais")}
      />
    );
  }

  // Dispatcher para la sección de Favoritos: cualquier tarjeta de la app se
  // puede favoritear, así que hace falta poder renderizar "la tarjeta que sea"
  // a partir de su sola clave, reusando exactamente el mismo render que usa
  // su sección de origen (misma data, mismo comportamiento).
  function renderPorClave(key: string) {
    if (key === "riesgoPais") return renderRiesgoPais();
    const moneda = MONEDA_POR_KEY.get(key);
    if (moneda) return renderMoneda(moneda);
    const mercado = MERCADO_POR_KEY.get(key);
    if (mercado) return renderMercado(mercado);
    return null; // favorito guardado de una clave que ya no existe
  }

  // Las cifras del momento de la tarjeta que ilustra la página, ya formateadas.
  function valoresEnVivo(clave: string): ValorDePagina[] {
    if (clave === "riesgoPais") {
      return riesgoPais.data
        ? [{ etiqueta: "Valor", texto: `${entero.format(riesgoPais.data.valor)} pb`, destacado: true }]
        : [];
    }
    if (clave === "btc") {
      const { data } = bitcoin;
      if (!data) return [];
      const variacion = data.changePercent;
      return [
        { etiqueta: "Precio", texto: dolares.format(data.price), destacado: true },
        ...(variacion !== null
          ? [{ etiqueta: "Últimas 24 h", texto: `${variacion > 0 ? "+" : ""}${variacion.toFixed(2)}%` }]
          : []),
      ];
    }
    const cotizacion = state[clave]?.data;
    return cotizacion
      ? [
          { etiqueta: "Compra", texto: pesos.format(cotizacion.compra) },
          { etiqueta: "Venta", texto: pesos.format(cotizacion.venta), destacado: true },
        ]
      : [];
  }

  function acentoDe(clave: string): string {
    if (clave === "riesgoPais") return RIESGO_PAIS_ACENTO;
    return MONEDA_POR_KEY.get(clave)?.accent ?? MERCADO_POR_KEY.get(clave)?.accent ?? "#78beff";
  }

  function nombreDeClave(key: string): string {
    if (key === "riesgoPais") return "Riesgo País";
    return MONEDA_POR_KEY.get(key)?.nombre ?? MERCADO_POR_KEY.get(key)?.label ?? key;
  }

  return (
    <>
      <NetworkBanner />
      <Toaster />
      <div className="app">
        <header className="header" ref={headerRef}>
          <div className="headerTop">
            <div className="brand">
              <BrandMark size={42} className="brandMark" />
              <div className="brandText">
                {pagina ? <p className="title">DollarTracker</p> : <h1 className="title">DollarTracker</h1>}
              </div>
            </div>

            <div className="headerActions">
              <CardInfoButton
                activo={mostrarInfoApp}
                onToggle={() => setMostrarInfoApp((v) => !v)}
                label="Acerca de DollarTracker"
              />

              <button
                className={`refreshAllBtn ${refrescando ? "refreshAllBtn--cargando" : ""}`}
                onClick={refreshAll}
                type="button"
                disabled={refrescando}
                aria-label={refrescando ? "Actualizando cotizaciones" : "Actualizar cotizaciones"}
                title="Actualizar cotizaciones"
              >
                <IconRefresh className="refreshAllBtn__icon" />
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

        <main>
        {pagina && <PaginaIntro pagina={pagina} accent={acentoDe(pagina.clave)} valores={valoresEnVivo(pagina.clave)} />}

        {favoritos.length > 0 && (
          <Seccion title="★ Favoritos">
              {favoritos.map((key, i) => {
                const tarjeta = renderPorClave(key);
                if (!tarjeta) return null; // clave de una versión vieja de la app

                return (
                  <div className="favSlot" key={key}>
                    <div className="favSlot__controls" role="group" aria-label={`Reordenar ${nombreDeClave(key)}`}>
                      <button
                        type="button"
                        className="favMoveBtn"
                        onClick={() => mover(key, -1)}
                        disabled={i === 0}
                        aria-label={`Subir ${nombreDeClave(key)}`}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="favMoveBtn"
                        onClick={() => mover(key, 1)}
                        disabled={i === favoritos.length - 1}
                        aria-label={`Bajar ${nombreDeClave(key)}`}
                      >
                        ▼
                      </button>
                    </div>
                    {tarjeta}
                  </div>
                );
              })}
          </Seccion>
        )}

        {CURRENCY_SECTIONS.map((section) => (
          <Seccion
            key={section.title}
            title={section.title}
            action={
              section.title === "Dólar" ? (
                <>
                  <button
                    type="button"
                    className="shareChip shareChip--neutral"
                    onClick={alternarConversor}
                    aria-expanded={mostrarConversor}
                    title="Convertir un monto entre pesos y otras monedas"
                  >
                    <IconSwap width={16} height={16} />
                    Convertir
                  </button>
                  <CompartirResumenButton datos={resumenDatos} disabled={resumenDatos.dolares.length === 0} />
                </>
              ) : undefined
            }
            intro={
              section.title === "Dólar" && mostrarConversor ? (
                <ConverterBar
                  monto={montoTexto}
                  origen={origen}
                  onMontoChange={setMontoTexto}
                  onOrigenChange={setOrigen}
                  autoFocus
                />
              ) : undefined
            }
          >
            {section.cards.map(renderMoneda)}
            {/* Bitcoin completa la fila junto a Euro y Real */}
            {section.title === "Otras monedas" && CRIPTO.map(renderMercado)}
          </Seccion>
        ))}

        <Seccion title="Mercados">
            {renderRiesgoPais()}
            {MERCADOS.map(renderMercado)}
        </Seccion>

        <Seccion title="Granos">{GRANOS.map(renderMercado)}</Seccion>
        </main>

        <footer className="footer">
          <div className="footerInfo">
            <div className="footerBrand">
              <BrandMark size={22} className="footerBrand__mark" />
              <span className="footerBrand__name">
                DollarTracker<sup>™</sup>
              </span>
            </div>
            <p className="footerNote">
              Datos de DolarAPI, ArgentinaDatos y Twelve Data. Valores de referencia, no asesoramiento financiero.
            </p>
            <nav className="footerNav" aria-label="Cotizaciones">
              {pagina && <a href="/">Inicio</a>}
              {PAGINAS.map((p) => (
                <a key={p.slug} href={`/${p.slug}`} aria-current={p.slug === pagina?.slug ? "page" : undefined}>
                  {p.nombre}
                </a>
              ))}
            </nav>
          </div>
          <a
            className="madeBy"
            href="https://www.instagram.com/200ok.dev/"
            target="_blank"
            rel="noopener"
            aria-label="200ok.dev en Instagram"
          >
            <span className="madeBy__text">made by</span>
            <img className="madeBy__logo madeBy__logo--dark" src="/200ok-logo.svg" alt="200ok.dev" width="149" height="26" loading="lazy" />
            <img className="madeBy__logo madeBy__logo--light" src="/200ok-logo-light.svg" alt="200ok.dev" width="149" height="26" loading="lazy" />
          </a>
        </footer>
      </div>
    </>
  );
}
