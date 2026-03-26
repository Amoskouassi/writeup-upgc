import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    middlewareMode: true,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8'
    }
  }
})