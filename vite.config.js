import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses, including LAN
    port: 5173,
    proxy: {
      // Proxy API calls to Vercel serverless functions
      // For local dev: run 'vercel dev' in a separate terminal (runs on port 3000)
      // On Vercel deployment, API calls go directly to serverless functions
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: false
      }
    }
  }
})