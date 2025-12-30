import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",

      // Vos ya registrás el SW en main.tsx, entonces evitamos el inject automático
      injectRegister: null,

      includeAssets: ["favicon.svg"],
      manifest: {
        id: "/",
        name: "Dólar Tracker",
        short_name: "Dólar",
        description: "Seguimiento de cotizaciones del dólar en Argentina",
        lang: "es-AR",
        theme_color: "#121212",
        background_color: "#121212",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      // CLAVE: no cachear iframes (widgets externos)
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "iframe",
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});
