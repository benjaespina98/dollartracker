import { describe, expect, it, vi } from "vitest";
import { mostrarToast, suscribirToast } from "./toast";

describe("toast", () => {
  it("avisa a los suscriptos y deja de avisar al darse de baja", () => {
    const oyente = vi.fn();
    const baja = suscribirToast(oyente);

    mostrarToast("Copiado");
    expect(oyente).toHaveBeenCalledWith("Copiado");

    baja();
    mostrarToast("Otra vez");
    expect(oyente).toHaveBeenCalledTimes(1);
  });
});
