import { Component, type ErrorInfo, type ReactNode } from "react";
import { BrandMark } from "./icons";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Red de seguridad de último recurso: sin esto, un error de render en
// cualquier tarjeta (un dato inesperado de alguna de las tres APIs externas,
// por ejemplo) tira abajo toda la app y deja una pantalla en blanco, sin
// ninguna pista de qué pasó ni forma de recuperarse sin que el usuario sepa
// que tiene que recargar a mano.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[DollarTracker] Error no capturado:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="appCrash">
          <div className="appCrash__card">
            <BrandMark size={42} className="appCrash__mark" />
            <h1 className="appCrash__title">Algo se rompió</h1>
            <p className="appCrash__text">
              DollarTracker encontró un error inesperado. Probá recargar la página; si el problema sigue,
              es un buen momento para reportarlo.
            </p>
            <button
              className="appCrash__btn"
              type="button"
              onClick={() => window.location.reload()}
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
