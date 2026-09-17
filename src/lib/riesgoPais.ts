export interface CategoriaRiesgoPais {
  label: string;
  tone: "low" | "medium" | "high" | "critical";
}

// Umbrales informales usados habitualmente para leer el índice de riesgo
// país. Vive acá (y no en RiesgoPaisCard) porque el resumen para compartir
// también necesita clasificar el valor, sin duplicar los números.
export function categoriaRiesgoPais(valor: number): CategoriaRiesgoPais {
  if (valor < 400) return { label: "Bajo", tone: "low" };
  if (valor < 800) return { label: "Moderado", tone: "medium" };
  if (valor < 1500) return { label: "Alto", tone: "high" };
  return { label: "Crítico", tone: "critical" };
}
