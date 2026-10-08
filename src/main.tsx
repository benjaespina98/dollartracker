import { Analytics } from '@vercel/analytics/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Las fuentes se piden después del primer dibujado: como <link> en el HTML
// bloqueaban la pantalla ~1,8 s en una conexión móvil lenta (Lighthouse). Con
// display=swap el texto aparece de inmediato con la fuente del sistema y
// cambia a Inter/Sora al llegar.
const fuentes = document.createElement('link')
fuentes.rel = 'stylesheet'
fuentes.href =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700&display=swap'
document.head.append(fuentes)

import { registerSW } from 'virtual:pwa-register'

// Con registerType 'autoUpdate', el Service Worker se auto-actualiza y recarga,
// pero solo cuando detecta una versión nueva — y eso normalmente solo pasa en
// la navegación inicial. En una PWA que queda abierta (o instalada) puede
// tardar mucho en darse cuenta de que hay un deploy nuevo. Forzamos un chequeo
// activo: cada 60s en segundo plano, y de inmediato cada vez que la pestaña/app
// vuelve a primer plano (el caso típico de "cerrar y reabrir el celular").
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return

    setInterval(() => registration.update(), 60 * 1000)

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update()
      }
    })
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    {/* Sin UI propia ni cookies: las visitas se ven solo en el dashboard de
        Vercel de quien es dueño del proyecto, nunca en la app. No hace nada
        fuera de un deploy en Vercel (en `npm run dev` no manda datos).
        VITE_DISABLE_ANALYTICS=true la apaga en el build. */}
    {import.meta.env.VITE_DISABLE_ANALYTICS !== 'true' && <Analytics />}
  </React.StrictMode>,
)
