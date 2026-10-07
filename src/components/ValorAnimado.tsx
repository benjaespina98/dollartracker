import { useState } from "react";

interface Props {
  /** Número que se está mostrando; un cambio dispara el destello */
  valor: number;
  texto: string;
  className: string;
}

// Un destello breve cuando el valor cambia: verde si subió, rojo si bajó. Sirve
// para notar que el dato se actualizó sin mirar la hora. No destella al montar
// (la tarjeta ya tiene su propia entrada) ni si el valor llega igual que antes.
export default function ValorAnimado({ valor, texto, className }: Props) {
  const [estado, setEstado] = useState({ valor, tono: "", n: 0 });

  // Derivado durante el render (patrón de React para "reaccionar a un cambio
  // de prop"): sin efecto ni parpadeo de un frame con el valor viejo.
  if (valor !== estado.valor) {
    setEstado({ valor, tono: valor > estado.valor ? "up" : "down", n: estado.n + 1 });
  }

  // La key distinta remonta el span, y con eso la animación CSS corre de nuevo
  // aunque dos cambios seguidos vayan en el mismo sentido.
  return (
    <span key={estado.n} className={`${className}${estado.tono ? ` valorFlash valorFlash--${estado.tono}` : ""}`}>
      {texto}
    </span>
  );
}
