import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tailwind v4 is wired in as a Vite plugin. There is deliberately no
// tailwind.config.js and no postcss.config.js — v4 does not use them.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
