import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Sparkline from "./Sparkline";

const render = (valores: number[], height = 26) =>
  renderToStaticMarkup(<Sparkline valores={valores} height={height} />);

describe("Sparkline", () => {
  it("dibuja un punto por valor, en orden", () => {
    const svg = render([10, 20, 30]);
    expect(svg).toContain('points="0.00,23.00 50.00,13.00 100.00,3.00"');
  });

  it("mantiene el grosor del trazo pese al estirado no uniforme", () => {
    // El viewBox se estira con preserveAspectRatio="none"; sin esto la línea
    // se deforma y queda más gruesa en un eje que en el otro.
    expect(render([1, 2])).toContain('vector-effect="non-scaling-stroke"');
  });

  it("no genera coordenadas inválidas con una serie plana", () => {
    // max === min haría una división por cero
    const svg = render([1500, 1500, 1500]);
    expect(svg).not.toContain("NaN");
    expect(svg).toContain('points="0.00,13.00 50.00,13.00 100.00,13.00"');
  });

  it("no dibuja nada si no hay al menos dos puntos", () => {
    expect(render([])).toBe("");
    expect(render([1500])).toBe("");
  });

  it("agrega el relleno solo cuando se lo pide", () => {
    expect(render([1, 2])).not.toContain("<polygon");
    const conArea = renderToStaticMarkup(<Sparkline valores={[1, 2]} height={130} conArea />);
    expect(conArea).toContain("<polygon");
    expect(conArea).toContain("linearGradient");
  });
});
