import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // To run the app on port 3000
    
},
  optimizeDeps: {
    exclude: ['lucide-react'],
    
  },
})
