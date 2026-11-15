import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In dev, forward /api to the backend (npm run dev in ../backend).
    proxy: {
      '/api': process.env.VITE_API_PROXY ?? 'http://localhost:4000',
    },
  },
})
