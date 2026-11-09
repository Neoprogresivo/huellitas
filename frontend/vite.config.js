import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En local, si VITE_API_BASE_URL está vacío, /api se redirige al backend local.
// En producción, VITE_API_BASE_URL debe tener la URL del backend Vercel.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:3001' }
  }
})
