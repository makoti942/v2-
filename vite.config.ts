import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['candle-icon-512.png'],
      manifest: {
        name: 'Makoti Predictor',
        short_name: 'Makoti',
        description: 'Advanced volatility prediction using multi-strategy consensus',
        theme_color: '#00ffff',
        background_color: '#0a0a0f',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'candle-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ws\.derivws\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'deriv-websocket',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
