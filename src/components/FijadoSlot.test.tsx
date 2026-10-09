import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FijadoSlot from "./FijadoSlot";

describe("FijadoSlot", () => {
  it("en reposo no aplica ningún translate: sería la referencia del popup de la tarjeta de adentro", () => {
    const html = renderToStaticMarkup(
      <FijadoSlot arrastrable onMover={() => {}}>
        <span>tarjeta</span>
      </FijadoSlot>
    );
    expect(html).not.toContain("translate");
    expect(html).not.toContain("transform");
    expect(html).toContain("tarjeta");
  });

  it("también en web (sin arrastre) queda sin estilos de posición", () => {
    const html = renderToStaticMarkup(
      <FijadoSlot arrastrable={false} onMover={() => {}}>
        <span>tarjeta</span>
      </FijadoSlot>
    );
    expect(html).not.toContain("style=");
  });
});
