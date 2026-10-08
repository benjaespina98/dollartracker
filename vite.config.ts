import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { PAGINAS } from './src/config/paginas'
import { generarSitemap, renderizarPagina } from './src/lib/paginasHtml'

// Al terminar el build, escribe dist/<slug>/index.html para cada página de
// cotización (con su título, descripción y texto propios) y el sitemap.xml con
// todas las direcciones. Es la misma app: solo cambia el HTML de arranque.
function paginasPorCotizacion(): Plugin {
  return {
    name: 'paginas-por-cotizacion',
    apply: 'build',
    closeBundle() {
      const dist = fileURLToPath(new URL('./dist/', import.meta.url))
      const base = readFileSync(dist + 'index.html', 'utf8')
      for (const pagina of PAGINAS) {
        mkdirSync(dist + pagina.slug, { recursive: true })
        writeFileSync(dist + pagina.slug + '/index.html', renderizarPagina(base, pagina))
      }
      writeFileSync(dist + 'sitemap.xml', generarSitemap())
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    paginasPorCotizacion(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        id: '/',
        name: 'DollarTracker',
        short_name: 'DollarTracker',
        description:
          'Cotizaciones del dólar (oficial, blue, MEP, CCL, cripto, tarjeta), euro, real brasileño, riesgo país y mercados internacionales, en tiempo real.',
        lang: 'es-AR',
        theme_color: '#08090c',
        background_color: '#08090c',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        categories: ['finance', 'business'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ sameOrigin }) => !sameOrigin,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
