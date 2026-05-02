import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks: {
          'flood-data': ['./src/data/floodPolygons.js'],
          'profile-data': ['./src/data/profiles.js'],
        }
      }
    }
  },
})
