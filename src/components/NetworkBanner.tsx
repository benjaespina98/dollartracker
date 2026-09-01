import { useEffect, useState } from "react";

// navigator.onLine ya refleja el estado real al montar (a diferencia de un
// useState(true) a secas): sin esto, quien abre la app ya sin señal no veía
// ningún aviso hasta que fallaba el primer fetch.
function estaOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine;
}

// Barra fija arriba de todo, independiente del estado por-tarjeta ("Sin
// conexión" en cada una): esta avisa una sola vez, apenas se corta la señal,
// en vez de que el usuario tenga que darse cuenta mirando dieciséis tarjetas.
export default function NetworkBanner() {
  const [online, setOnline] = useState(estaOnline);

  useEffect(() => {
    const marcarOnline = () => setOnline(true);
    const marcarOffline = () => setOnline(false);
    window.addEventListener("online", marcarOnline);
    window.addEventListener("offline", marcarOffline);
    return () => {
      window.removeEventListener("online", marcarOnline);
      window.removeEventListener("offline", marcarOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="networkBanner" role="status">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M2 2l20 20" />
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M5 12.5a10 10 0 0 1 4-2.4M15.4 10.4a10 10 0 0 1 3.6 2.1M8.5 16a5.5 5.5 0 0 1 7 0"
        />
        <circle cx="12" cy="19.5" r="1.2" fill="currentColor" />
      </svg>
      Sin conexión — mostrando últimos datos guardados
    </div>
  );
}
