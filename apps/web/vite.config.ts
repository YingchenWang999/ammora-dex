import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envDir: '../../',
  optimizeDeps: {
    // This workspace package reads Vite deployment variables at runtime.
    exclude: ['@ammora/contract-config'],
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
})
