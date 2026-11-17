import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import "./App.css";
import CompartirResumenButton from "./components/CompartirResumenButton";
import ConverterBar from "./components/ConverterBar";
import { CardInfoButton, CardInfoPanel } from "./components/ExpandedChrome";
import { BrandMark, IconPulse, IconSwap } from "./components/icons";
import MarketCard from "./components/MarketCard";
import NetworkBanner from "./components/NetworkBanner";
import PaginaIntro, { type ValorDePagina } from "./components/PaginaIntro";
import QuoteCard from "./components/QuoteCard";
import RiesgoPaisCard from "./components/RiesgoPaisCard";
import FijadoSlot from "./components/FijadoSlot";
import Seccion from "./components/Seccion";
import Toaster from "./components/Toaster";
import { PAGINAS, SITIO, paginaPorRuta } from "./config/paginas";
import { CRIPTO, CURRENCY_SECTIONS, GRANOS, MERCADOS, type CurrencyCardConfig, type MarketCardConfig } from "./config/cards";
import { useBinanceQuotes, useHistoricoBinance, type ActivoBinance } from "./hooks/useBinance";
import { useCotizaciones } from "./hooks/useCotizaciones";
import { useDismiss } from "./hooks/useDismiss";
import { useFavoritos } from "./hooks/useFavoritos";
import { useHistoricoMercados } from "./hooks/useHistorico";
import { useEsMovil } from "./hooks/useEsMovil";
import { useMarketData } from "./hooks/useMarketData";
import { parsearMonto, type MonedaOrigen } from "./lib/conversion";
import { hayAlgunDatoDesactualizado } from "./lib/estadoDatos";
import { dolares, entero, formatearHora, pesos } from "./lib/format";
import { esClicDeNavegacionNormal } from "./lib/navegacion";
import { prepararResumen } from "./lib/resumenImagen";

const TITULO_HOME = "DollarTracker — Cotizaciones del dólar, euro y real en Argentina";
const DESCRIPCION_HOME =
  "Cotizaciones del dólar hoy en Argentina: oficial, blue, MEP, CCL, cripto y tarjeta, más euro, real, riesgo país y mercados. Con histórico y sin registrarte.";

// Un solo lugar para ir de "clave de favorito" (casa, key de mercado/grano, o
// el literal "riesgoPais") a su configuración estática, sin repetir el
// .find/.get en cada lugar que necesita renderizar una tarjeta por su clave.
const MONEDA_POR_KEY = new Map<string, CurrencyCardConfig>(
  CURRENCY_SECTIONS.flatMap((seccion) => seccion.cards).map((c) => [c.key, c])
);
// El rojo de la tarjeta de Riesgo País; lo usan la tarjeta y el encabezado de su página.
const RIESGO_PAIS_ACENTO = "#f87171";
const MERCADO_POR_KEY = new Map<string, MarketCardConfig>([...MERCADOS, ...GRANOS, ...CRIPTO].map((m) => [m.key, m]));
// Activos cuyo precio e histórico salen de Binance (cripto y oro).
const ACTIVOS_BINANCE: ActivoBinance[] = [...MERCADOS, ...GRANOS, ...CRIPTO]
  .filter((m) => m.binance)
  .map((m) => ({ key: m.key, symbol: m.binance! }));

export default function App() {
  const { state } = useCotizaciones();
  const { riesgoPais, markets } = useMarketData();
  const historicoMercados = useHistoricoMercados();
  const binance = useBinanceQuotes(ACTIVOS_BINANCE);
  const historicoBinance = useHistoricoBinance(ACTIVOS_BINANCE);
  // /dolar-blue, /dolar-mep…: la misma app con un título y un texto propios.
  // Los enlaces que se quedan dentro de la app (header, pie, la propia
  // página) navegan con el historial en vez de recargar el documento: entrar
  // y salir de estas páginas es instantáneo, y atrás/adelante del navegador
  // funcionan como se espera. Un enlace externo o la URL tipeada de cero
  // siguen sirviendo el HTML ya armado para cada página (ver vite.config.ts).
  const [ruta, setRuta] = useState(() => window.location.pathname);
  useEffect(() => {
    const alCambiarHistorial = () => setRuta(window.location.pathname);
    window.addEventListener("popstate", alCambiarHistorial);
    return () => window.removeEventListener("popstate", alCambiarHistorial);
  }, []);
  const pagina = useMemo(() => paginaPorRuta(ruta), [ruta]);

  const irA = useCallback((nuevaRuta: string) => {
    if (nuevaRuta !== window.location.pathname) {
      window.history.pushState(null, "", nuevaRuta);
      setRuta(nuevaRuta);
    }
    window.scrollTo({ top: 0 });
  }, []);

  const manejarNavegacion = useCallback(
    (nuevaRuta: string) => (e: MouseEvent<HTMLAnchorElement>) => {
      if (!esClicDeNavegacionNormal(e)) return;
      e.preventDefault();
      irA(nuevaRuta);
    },
    [irA]
  );
  const { favoritos, esFavorito, toggleFavorito, mover } = useFavoritos();
  // En celular se reordena arrastrando; en web quedan las flechas.
  const esMovil = useEsMovil();

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

  // El "Acerca de" del header se cierra tocando afuera del header o con Escape.
  const headerRef = useRef<HTMLElement | null>(null);
  const cerrarInfoApp = useCallback(() => setMostrarInfoApp(false), []);
  useDismiss(mostrarInfoApp, headerRef, cerrarInfoApp);

  // El HTML de cada página ya trae su título (ver vite.config.ts), pero un
  // service worker puede servir el de otra, y ahora que se navega sin
  // recargar (ver `irA`) nada más actualiza estos tags al ir de una página a
  // otra o de vuelta a la home: acá se corrigen siempre del lado del cliente.
  useEffect(() => {
    document.title = pagina ? pagina.titulo : TITULO_HOME;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", pagina ? pagina.descripcion : DESCRIPCION_HOME);
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", pagina ? `${SITIO}/${pagina.slug}` : `${SITIO}/`);
  }, [pagina]);

  // Base de la brecha cambiaria (blue/MEP/CCL contra el oficial). Si el
  // oficial todavía no llegó o vale 0, ninguna tarjeta muestra el badge.
  const ventaOficial = state.oficial?.data?.venta ?? null;

  // Hora de nuestro último refresco correcto. No es la fecha que informa la
  // fuente: DolarAPI la redondea y puede quedarse igual aunque la app sí
  // consulte cada 5 minutos.
  const ultimaActualizacion = useMemo(() => {
    const momentos = [...Object.values(state).map((e) => e.savedAt), riesgoPais.savedAt].filter(
      (t): t is number => t !== null
    );
    return momentos.length ? formatearHora(new Date(Math.max(...momentos))) : null;
  }, [state, riesgoPais.savedAt]);

  // "cotizaciones en vivo" es una afirmación de frescura: si alguna de las
  // cotizaciones principales quedó en "stale" o "error" (la fuente falló y se
  // está mostrando la última copia guardada), no corresponde seguir
  // afirmándolo. Nunca se presenta un dato viejo como si fuera actual.
  const hayDatosDesactualizados = useMemo(
    () => hayAlgunDatoDesactualizado([...Object.values(state).map((e) => e.status), riesgoPais.status]),
    [state, riesgoPais.status]
  );

  // Un refresco periódico vuelve a poner "loading" en todas las fuentes antes
  // de pedir los datos de nuevo. Lo usamos para mostrar un pulso breve junto a
  // la hora: confirma que la app realmente está sincronizando en ese momento,
  // no un adorno fijo.
  const sincronizando = useMemo(
    () =>
      [...Object.values(state), riesgoPais, ...Object.values(markets), ...Object.values(binance.quotes)].some(
        (entry) => entry?.status === "loading"
      ),
    [state, riesgoPais, markets, binance.quotes]
  );

  // dibujarResumen recién lee esto al tocar "Resumen", pero recalcularlo acá
  // en cada refresco de cotizaciones (y no en cada tecla del conversor, que no
  // lo toca) es barato y evita rearmarlo desde cero en el click.
  const resumenDatos = useMemo(
    () => prepararResumen(state, riesgoPais.data),
    [state, riesgoPais.data]
  );


  function renderMercado({ key, label, ticker, detalle, accent, icon, info, variacionTitle }: MarketCardConfig) {
    // Cripto y oro vienen de Binance (otra fuente, otra cadencia).
    const esBinance = ACTIVOS_BINANCE.some((a) => a.key === key);
    const entry = esBinance ? binance.quotes[key] : markets[key];
    const historico = esBinance ? (historicoBinance[key] ?? null) : (historicoMercados?.[key] ?? null);

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

  function renderMoneda({ key, label, nombre, accent, icon, conBrecha, descripcion }: CurrencyCardConfig) {
    const ventaCasa = state[key]?.data?.venta ?? null;
    const brecha =
      conBrecha && ventaOficial && ventaCasa ? ((ventaCasa - ventaOficial) / ventaOficial) * 100 : null;

    return (
      <QuoteCard
        key={key}
        casa={key}
        label={label}
        nombre={nombre}
        descripcion={descripcion}
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
      const data = binance.quotes.btc?.data ?? null;
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
                {pagina ? (
                  <p className="title">
                    <a className="title__link" href="/" onClick={manejarNavegacion("/")}>
                      DollarTracker
                    </a>
                  </p>
                ) : (
                  <h1 className="title">DollarTracker</h1>
                )}
                {ultimaActualizacion && (
                  <p className={`actualizado ${hayDatosDesactualizados ? "actualizado--alerta" : ""}`}>
                    {!hayDatosDesactualizados && sincronizando && (
                      <span className="actualizado__sync" aria-hidden="true" />
                    )}
                    {hayDatosDesactualizados
                      ? "Algunas cotizaciones no se pudieron actualizar"
                      : `Hoy ${ultimaActualizacion} · cotizaciones en vivo`}
                  </p>
                )}
              </div>
            </div>

            <div className="headerActions">
              <CardInfoButton
                activo={mostrarInfoApp}
                onToggle={() => setMostrarInfoApp((v) => !v)}
                label="Acerca de DollarTracker"
              />

            </div>
          </div>

          {mostrarInfoApp && (
            <CardInfoPanel>
              DollarTracker reúne cotizaciones del dólar y otras monedas (DolarAPI), riesgo país (ArgentinaDatos),
              criptoactivos y oro (Binance) e instrumentos internacionales vía ETF (Twelve Data). Cada tarjeta
              detalla su fuente, su par o ticker y su metodología en el botón (i). Los
              valores son de referencia; no constituyen asesoramiento financiero ni recomendación de inversión. Sin
              cuentas ni backend propio: todo se calcula en este dispositivo.
            </CardInfoPanel>
          )}
        </header>

        <main>
        {pagina && (
          <PaginaIntro
            pagina={pagina}
            accent={acentoDe(pagina.clave)}
            valores={valoresEnVivo(pagina.clave)}
            onNavegar={irA}
          />
        )}

        {favoritos.length > 0 && (
          <Seccion title="Fijados">
              {favoritos.map((key, i) => {
                const tarjeta = renderPorClave(key);
                if (!tarjeta) return null; // clave de una versión vieja de la app

                return (
                  <FijadoSlot key={key} arrastrable={esMovil} onMover={(d) => mover(key, d)}>
                    {!esMovil && (
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
                    )}
                    {tarjeta}
                  </FijadoSlot>
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
              section.title === "Dólar" ? (
                <>
                  {mostrarConversor && (
                    <ConverterBar
                      monto={montoTexto}
                      origen={origen}
                      onMontoChange={setMontoTexto}
                      onOrigenChange={setOrigen}
                      autoFocus
                    />
                  )}
                </>
              ) : undefined
            }
          >
            {section.cards.map(renderMoneda)}
          </Seccion>
        ))}

        <Seccion title="Mercados">
            {renderRiesgoPais()}
            {MERCADOS.map(renderMercado)}
        </Seccion>

        <Seccion title="Granos">{GRANOS.map(renderMercado)}</Seccion>

        <Seccion title="Cripto">{CRIPTO.map(renderMercado)}</Seccion>
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
              Datos de DolarAPI, ArgentinaDatos, Binance, CriptoYa y Twelve Data. Valores de referencia; no
              constituyen asesoramiento financiero.
            </p>
            <nav className="footerNav" aria-label="Cotizaciones">
              {pagina && (
                <a href="/" onClick={manejarNavegacion("/")}>
                  Inicio
                </a>
              )}
              {PAGINAS.map((p) => (
                <a
                  key={p.slug}
                  href={`/${p.slug}`}
                  aria-current={p.slug === pagina?.slug ? "page" : undefined}
                  onClick={manejarNavegacion(`/${p.slug}`)}
                >
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
