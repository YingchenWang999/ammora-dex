import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envDir: '../../',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react/jsx-runtime'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
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
