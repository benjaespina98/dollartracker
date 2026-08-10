import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
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
        theme_color: '#101012',
        background_color: '#101012',
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
