// Vite configuration for Synchronous Generator Simulator
import { defineConfig } from 'vite';

export default defineConfig({
  // Project root
  root: '.',

  // Public assets directory
  publicDir: 'public',

  // Development server options
  server: {
    port: 5173,
    open: true, // Auto-open browser
    cors: true,
  },

  // Build options
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
  },

  // Preview server (for testing production build)
  preview: {
    port: 4173,
    open: true,
  },

  // ES module support (native browser)
  resolve: {
    alias: {
      '@': '/src',
      '@physics': '/src/physics',
      '@renderers': '/src/renderers',
      '@ui': '/src/ui',
    },
  },
});
