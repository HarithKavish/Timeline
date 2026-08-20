import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Timeline is deployed to GitHub Pages behind the custom domain
 * timeline.harithkavish.com, so the app is served from the domain root.
 *
 * If you ever deploy to `https://<user>.github.io/timeline/` instead, set
 * TIMELINE_BASE=/timeline/ at build time — nothing else needs to change.
 */
const base = process.env.TIMELINE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
  },
  server: {
    port: 5173,
  },
});
