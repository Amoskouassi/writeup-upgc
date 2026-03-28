import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife',
        manualChunks: undefined,
      }
    }
  },
  server: {
    port: 3000,
  }
})
