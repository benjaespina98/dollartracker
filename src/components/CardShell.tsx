import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { recortarRango, type RangoDias, type SeriePunto } from "../hooks/useHistorico";
import { useDismiss } from "../hooks/useDismiss";
import { useEsMovil } from "../hooks/useEsMovil";
import { useModalCard } from "../hooks/useModalCard";
import { useSwipeToClose } from "../hooks/useSwipeToClose";
import { CardBackdrop, CardCloseButton, CardFavoritoButton, CardInfoButton, CardInfoPanel } from "./ExpandedChrome";
import ShareButton from "./ShareButton";
import Sparkline from "./Sparkline";
import SparklineRow from "./SparklineRow";

const HistoricoPanel = lazy(() => import("./HistoricoPanel"));

export type CardStatus = "loading" | "ready" | "stale" | "error";

/** Lo que muestra la tarjeta cuando en celular se reduce a una fila de la lista. */
export interface FilaCompacta {
  /** Valor principal (la venta, o el resultado de la conversión) */
  valor?: ReactNode;
  /** Línea chica bajo el nombre */
  detalle?: ReactNode;
  /** Chip bajo el valor (variación o aviso de sin conexión) */
  chip?: ReactNode;
}

interface Props {
  label: string;
  /** Nombre completo, para el tooltip y los lectores de pantalla */
  nombre?: string;
  icon: ReactNode;
  accent: string;
  status: CardStatus;
  hayDatos: boolean;
  /** Línea a compartir; null mientras no haya datos */
  shareText: string | null;
  /** Explicación que despliega el botón (i) de la tarjeta abierta */
  info: ReactNode;
  /** Serie completa del activo; null si todavía no llegó o no existe */
  serie: SeriePunto[] | null;
  /** Las tarjetas sin serie (euro, real) no reservan el hueco del gráfico */
  conGrafico?: boolean;
  formatValor: (valor: number) => string;
  skeletonBlocks?: number;
  /** Bloque principal: precio, conversión o valor del índice */
  children: ReactNode;
  /** Fila inferior: variación, hora del dato, estado offline */
  meta: ReactNode;
  /** Con esto, en celular la tarjeta es una fila de lista; al tocarla se abre completa */
  fila?: FilaCompacta;
  favorito: boolean;
  onToggleFavorito: () => void;
}

// Carcasa común de las tres tarjetas (cotización, mercado, riesgo país). Antes
// cada una repetía el mismo backdrop, header, cuerpo clickeable, panel (i) y
// gráfico expandido: ~120 líneas idénticas por archivo, y cada arreglo había
// que aplicarlo tres veces.
export default function CardShell({
  label,
  nombre = label,
  icon,
  accent,
  status,
  hayDatos,
  shareText,
  info,
  serie,
  conGrafico = true,
  formatValor,
  skeletonBlocks = 1,
  children,
  meta,
  fila,
  favorito,
  onToggleFavorito,
}: Props) {
  const [expandida, setExpandida] = useState(false);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [rango, setRango] = useState<RangoDias>(30);

  // Para devolver el foco a la tarjeta cuando se cierra el modal, en vez de
  // mandarlo al principio del documento.
  const disparador = useRef<HTMLElement | null>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const filaRef = useRef<HTMLButtonElement>(null);
  const seAbrio = useRef(false);
  const esMovil = useEsMovil();

  const puedeExpandirse = hayDatos && (serie?.length ?? 0) >= 2;
  // recortarRango recorre toda la serie (hasta 400 puntos por tarjeta): sin
  // memo se rehacía en cada render, incluso al tipear en el conversor.
  const serieMini = useMemo(
    () => (serie && serie.length >= 2 ? recortarRango(serie, 30).map((p) => p.valor) : null),
    [serie]
  );

  const cerrar = useCallback(() => {
    setExpandida(false);
    setMostrarInfo(false);
  }, []);

  const abrir = useCallback(() => {
    disparador.current = document.activeElement as HTMLElement | null;
    setExpandida(true);
  }, []);

  // Antes el botón (i) solo aparecía con la tarjeta ya abierta: para
  // encontrarlo primero había que descubrir, sin ninguna pista, que la
  // tarjeta se podía tocar. Ahora vive siempre en el header y, en una
  // tarjeta con histórico, tocarlo hace las dos cosas a la vez: abre el
  // detalle y muestra la explicación ahí adentro, así quien lo toca
  // descubre de una que la tarjeta se expande.
  const alternarInfo = useCallback(() => {
    if (!expandida && puedeExpandirse) {
      abrir();
      setMostrarInfo(true);
    } else {
      setMostrarInfo((v) => !v);
    }
  }, [expandida, puedeExpandirse, abrir]);

  useModalCard(expandida, cerrar);

  useEffect(() => {
    if (expandida) {
      seAbrio.current = true;
      cerrarRef.current?.focus();
    } else if (seAbrio.current) {
      // En modo fila el botón que se tocó ya no existe (se rearmó): se vuelve a la fila.
      (filaRef.current ?? disparador.current)?.focus();
    }
  }, [expandida]);

  // El cuerpo solo abre; para cerrar están la X, el fondo, Escape y deslizar
  // de izquierda a derecha. Cuando el cuerpo también cerraba, cualquier clic
  // sobre el gráfico o los botones de rango hacía desaparecer la tarjeta que
  // se estaba mirando.
  const abrible = puedeExpandirse && !expandida;

  const { ref: swipeRef, arrastreX, arrastrando } = useSwipeToClose(expandida, cerrar);

  // La explicación en línea (tarjetas sin gráfico, como Euro y Real) se cierra
  // tocando afuera o con Escape, no solo volviendo a tocar el (i).
  const cerrarInfo = useCallback(() => setMostrarInfo(false), []);
  useDismiss(mostrarInfo && !expandida, swipeRef, cerrarInfo);

  const modoFila = esMovil && fila !== undefined && !expandida;

  const contenidoFila = fila && (
    <>
      <span className="quoteIcon">{icon}</span>
      <span className="quoteRow__texto">
        <span className="quoteRow__titulo">{label}</span>
        {hayDatos && fila.detalle && <span className="quoteRow__detalle">{fila.detalle}</span>}
      </span>
      {hayDatos ? (
        <>
          <span className="quoteRow__spark">{serieMini && <Sparkline valores={serieMini} height={24} />}</span>
          <span className="quoteRow__valor">
            {fila.valor}
            {fila.chip}
          </span>
        </>
      ) : status === "error" ? (
        <span className="quoteRow__vacio">Sin dato</span>
      ) : (
        <span className="quoteRow__vacio quoteRow__skeleton" aria-label={`Cargando ${nombre}`} />
      )}
    </>
  );

  return (
    <>
      {expandida && <CardBackdrop onClose={cerrar} />}
      <section
        ref={swipeRef}
        className={`quoteCard ${expandida ? "quoteCard--expandida" : ""} ${modoFila ? "quoteCard--fila" : ""}`}
        style={
          {
            "--accent": accent,
            ...(expandida
              ? {
                  translate: `${arrastreX}px 0`,
                  opacity: arrastreX > 0 ? Math.max(1 - arrastreX / 280, 0.4) : undefined,
                  transition: arrastrando ? "none" : "translate 0.2s ease-out, opacity 0.2s ease-out",
                }
              : null),
          } as CSSProperties
        }
        {...(expandida ? { role: "dialog", "aria-modal": true, "aria-label": nombre } : {})}
      >
        {modoFila ? (
          puedeExpandirse ? (
            <button
              ref={filaRef}
              type="button"
              className="quoteRow quoteRow--abrible"
              onClick={abrir}
              aria-haspopup="dialog"
              title={`${nombre}: ver histórico`}
            >
              {contenidoFila}
            </button>
          ) : (
            <div className="quoteRow">{contenidoFila}</div>
          )
        ) : (
          <>
        <header className="quoteHeader">
          <div className="quoteTitleGroup">
            <span className="quoteIcon">{icon}</span>
            <h3 className="quoteTitle" title={nombre}>
              {nombre !== label && <span className="visuallyHidden">{nombre}</span>}
              <span aria-hidden={nombre !== label}>{label}</span>
            </h3>
          </div>
          <div className="quoteHeaderActions">
            <CardFavoritoButton
              activo={favorito}
              onToggle={onToggleFavorito}
              label={favorito ? `Quitar ${nombre} de favoritos` : `Agregar ${nombre} a favoritos`}
            />
            <CardInfoButton
              activo={mostrarInfo}
              onToggle={alternarInfo}
              label={`Qué estoy viendo: ${nombre}`}
            />
            {expandida ? (
              <CardCloseButton ref={cerrarRef} onClose={cerrar} label={`Cerrar ${nombre}`} />
            ) : (
              shareText && <ShareButton texto={shareText} label={`Compartir ${nombre}`} />
            )}
          </div>
        </header>

        {/* El botón de compartir vive en el header, fuera de este div, así que
            podemos hacer clickeable todo el cuerpo sin anidar controles. */}
        <div
          className={`quoteBody quoteBody--${status} ${abrible ? "quoteBody--expandible" : ""}`}
          onClick={abrible ? abrir : undefined}
          onKeyDown={
            abrible
              ? (e) => {
                  // Solo el propio cuerpo: si no, un Enter sobre un botón de
                  // rango o de info burbujeaba y también abría/cerraba.
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    abrir();
                  }
                }
              : undefined
          }
          role={abrible ? "button" : undefined}
          tabIndex={abrible ? 0 : undefined}
          aria-haspopup={abrible ? "dialog" : undefined}
        >
          {/* Independiente de si hay datos o de si la tarjeta está expandida:
              la explicación de qué es esta cifra no depende de haberla podido
              traer recién, y en las tarjetas sin histórico (euro, real) es la
              única forma de llegar a leerla, porque nunca se abren en modal. */}
          {mostrarInfo && <CardInfoPanel>{info}</CardInfoPanel>}

          {status === "loading" && !hayDatos && (
            <div className="skeleton" aria-label={`Cargando ${nombre}`}>
              {Array.from({ length: skeletonBlocks }, (_, i) => (
                <span key={i} className="skeletonBlock" style={{ "--i": i } as CSSProperties} />
              ))}
            </div>
          )}
          {status === "error" && !hayDatos && (
            <span className="quoteError">No se pudo obtener el dato</span>
          )}

          {hayDatos && (
            // Reemplaza al esqueleto con una pequeña transición en vez de un
            // corte seco: la animación solo corre al montar (el bloque no se
            // desmonta en refrescos posteriores, mientras hayDatos siga true).
            <div className="quoteBodyContent">
              {children}

              {/* El hueco se reserva desde el vamos aunque la serie todavía no
                  haya llegado: si no, las tarjetas pegaban un salto al aparecer
                  el gráfico unos milisegundos después del precio. */}
              {conGrafico && (
                <SparklineRow
                  valores={serieMini}
                  expandida={expandida}
                  expandible={puedeExpandirse}
                />
              )}

              <div className="quoteMeta">{meta}</div>

              {expandida && serie && (
                <Suspense fallback={null}>
                  <HistoricoPanel
                    serie={serie}
                    rango={rango}
                    onRangoChange={setRango}
                    formatValor={formatValor}
                  />
                </Suspense>
              )}
            </div>
          )}
        </div>
          </>
        )}
      </section>
    </>
  );
}
