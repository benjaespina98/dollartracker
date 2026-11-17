import type { MouseEvent } from "react";

// Clic primario sin modificadores: el que, de dejarlo pasar, el navegador
// seguiría abriendo en la misma pestaña. Con cualquier otro (clic derecho,
// con la rueda, Ctrl/Cmd+clic) hay que dejar que el navegador haga lo suyo
// (nueva pestaña, menú contextual) en vez de interceptarlo para navegar
// dentro de la misma página.
export function esClicDeNavegacionNormal(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
