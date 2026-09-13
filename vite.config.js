import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/, so every
// asset URL (including the Stockfish worker script) needs the "/<repo>/" prefix at
// build time. The included GitHub Actions workflow (.github/workflows/deploy.yml)
// computes this automatically from the repository name and passes it in as
// VITE_BASE_PATH, so you normally never need to touch this file.
//
// Building locally (npm run build) without that env var falls back to "/", which is
// also correct for `npm run dev` and for a user/organization page repo.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  build: {
    // Keep the Stockfish files (copied into public/engine) out of the JS bundle;
    // they're loaded at runtime as a classic Worker script, not imported as a module.
    assetsInlineLimit: 0,
  },
})
