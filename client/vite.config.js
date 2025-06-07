// meter-tracker/client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxying API requests to the backend server
      '/api': {
        target: 'http://localhost:5001', // Your backend server URL
        changeOrigin: true, // Recommended for virtual hosted sites
        // secure: false, // If your backend is not using HTTPS
      },
    },
  },
})