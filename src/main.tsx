import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

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
    <App />
  </React.StrictMode>,
)
