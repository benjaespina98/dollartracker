import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { recortarRango, type RangoDias, type SeriePunto } from "../hooks/useHistorico";
import { useModalCard } from "../hooks/useModalCard";
import { CardBackdrop, CardCloseButton, CardInfoButton, CardInfoPanel } from "./ExpandedChrome";
import HistoricoPanel from "./HistoricoPanel";
import ShareButton from "./ShareButton";
import SparklineRow from "./SparklineRow";

export type CardStatus = "loading" | "ready" | "stale" | "error";

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
}: Props) {
  const [expandida, setExpandida] = useState(false);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [rango, setRango] = useState<RangoDias>(30);

  // Para devolver el foco a la tarjeta cuando se cierra el modal, en vez de
  // mandarlo al principio del documento.
  const disparador = useRef<HTMLElement | null>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);

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
    if (expandida) cerrarRef.current?.focus();
    else disparador.current?.focus();
  }, [expandida]);

  // El cuerpo solo abre; para cerrar están la X, el fondo y Escape. Cuando
  // también cerraba, cualquier clic sobre el gráfico o los botones de rango
  // hacía desaparecer la tarjeta que se estaba mirando.
  const abrible = puedeExpandirse && !expandida;

  return (
    <>
      {expandida && <CardBackdrop onClose={cerrar} />}
      <section
        className={`quoteCard ${expandida ? "quoteCard--expandida" : ""}`}
        style={{ "--accent": accent } as CSSProperties}
        {...(expandida ? { role: "dialog", "aria-modal": true, "aria-label": nombre } : {})}
      >
        <header className="quoteHeader">
          <div className="quoteTitleGroup">
            <span className="quoteIcon">{icon}</span>
            <h3 className="quoteTitle" title={nombre}>
              {nombre !== label && <span className="visuallyHidden">{nombre}</span>}
              <span aria-hidden={nombre !== label}>{label}</span>
            </h3>
          </div>
          <div className="quoteHeaderActions">
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
          aria-label={abrible ? `${nombre}: ver histórico` : undefined}
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
                <HistoricoPanel
                  serie={serie}
                  rango={rango}
                  onRangoChange={setRango}
                  formatValor={formatValor}
                />
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
