import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses, including LAN
    port: 5173,
    // Proxy API requests to Vercel dev server (if running on port 3000)
    // If vercel dev is not running, the API will fail gracefully with a clear error
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Only proxy API requests, not source files
        rewrite: (path) => path,
        // If Vercel dev is not running, let the request fail so we can show a helpful error
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('API proxy error - is Vercel dev running?', err.message);
          });
        }
      }
    }
    // Note: For local testing, install Vercel CLI and run 'vercel dev' in a separate terminal
    // This will start the API server on port 3000, and Vite will proxy requests to it
    // Or test directly on your Vercel deployment
  }
})