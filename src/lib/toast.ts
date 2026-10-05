type Oyente = (mensaje: string) => void;

const oyentes = new Set<Oyente>();

/** Avisa algo breve ("Copiado") sin que cada botón tenga que dibujar su propio cartel. */
export function mostrarToast(mensaje: string): void {
  oyentes.forEach((oyente) => oyente(mensaje));
}

export function suscribirToast(oyente: Oyente): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}
