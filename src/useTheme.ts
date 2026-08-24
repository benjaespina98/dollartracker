import { useCallback, useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "dollartracker-theme";

// Mismos valores que el fondo de cada tema: pintan la barra de estado del
// navegador y de la PWA instalada, que si no se quedaba siempre oscura.
const THEME_COLOR: Record<Theme, string> = { dark: "#08090c", light: "#f4f6f8" };

// El script inline de index.html ya resolvió el tema antes del primer pintado
// (si no, el que usa tema claro veía un fogonazo oscuro en cada carga).
// Leemos de ahí para no volver a decidirlo con otro criterio.
function getInitialTheme(): Theme {
  const marcado = document.documentElement.getAttribute("data-theme");
  if (marcado === "light" || marcado === "dark") return marcado;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage bloqueado (modo privado, cookies de terceros): la app
      // sigue funcionando, solo no se recuerda la preferencia.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
