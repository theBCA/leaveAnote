import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor'
          if (id.includes('firebase')) return 'firebase-vendor'
          if (id.includes('html2canvas')) return 'html2canvas-vendor'
          if (id.includes('jspdf')) return 'jspdf-vendor'
          if (id.includes('framer-motion')) return 'motion-vendor'
          return 'vendor'
        },
      },
    },
  },
})
