import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Where the app is served from. Netlify, Vercel and Cloudflare Pages all serve
// it at the domain root, so "/" is the default. GitHub Pages serves a project
// at /<repo>/, so that build sets BASE_PATH=/Dagstartapp/ — and the PWA
// manifest has to agree, or the app cannot be installed to the home screen.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The service worker updates itself in the background and takes over on
      // the next launch. No "new version available" prompt to dismiss — this
      // app is opened half-awake.
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon.png', 'icon.svg'],
      manifest: {
        name: 'Anker',
        short_name: 'Anker',
        description: 'Persoonlijk dagelijks houvast: check-in, gedachten, historie.',
        lang: 'nl',
        start_url: base,
        scope: base,
        // standalone is what gives the app its own storage freshness counter
        // on iOS, instead of sharing Safari's.
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the whole app: it is small, and it means Anker opens with
        // no network at all — on the train, abroad, in a basement.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
