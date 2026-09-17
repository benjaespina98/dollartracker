import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

// renderToStaticMarkup (el renderer que ya usa el resto de la suite) no
// ejecuta el ciclo de commit de React, así que un error boundary real ahí
// nunca se dispara y el throw de un hijo se propaga igual que sin boundary.
// Probamos entonces la lógica propia del componente —qué estado deriva de un
// error y qué UI arma con ese estado— en vez de la maquinaria de React, que
// no es nuestra responsabilidad.
describe("ErrorBoundary", () => {
  it("deja pasar los hijos cuando no hay error", () => {
    const html = renderToStaticMarkup(
      <ErrorBoundary>
        <span>todo bien</span>
      </ErrorBoundary>
    );
    expect(html).toContain("todo bien");
  });

  it("deriva el estado de error para la próxima renderización", () => {
    const error = new Error("boom");
    expect(ErrorBoundary.getDerivedStateFromError(error)).toEqual({ error });
  });

  it("con estado de error, muestra una pantalla de recuperación en vez de tirar abajo toda la app", () => {
    const boundary = new ErrorBoundary({ children: <span>nunca se llega a esto</span> });
    boundary.state = { error: new Error("boom") };

    const html = renderToStaticMarkup(boundary.render());
    expect(html).toContain("Algo se rompió");
    expect(html).toContain("Recargar");
    expect(html).not.toContain("nunca se llega a esto");
  });

  it("loguea el error a la consola para poder diagnosticarlo", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const boundary = new ErrorBoundary({ children: null });
    boundary.componentDidCatch(new Error("boom"), { componentStack: "  in Foo" });
    expect(spy).toHaveBeenCalledWith(
      "[DollarTracker] Error no capturado:",
      expect.any(Error),
      "  in Foo"
    );
    spy.mockRestore();
  });
});
