import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses, including LAN
    port: 5173
    // Note: API calls work automatically on Vercel via serverless functions
    // For local testing, install Vercel CLI and run 'vercel dev' in a separate terminal
    // Or test directly on your Vercel deployment
  }
})