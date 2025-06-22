// meter-tracker/client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- NEW SECTION ---
  // Define global constants to be replaced during build
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version)
  },
  // --- END OF NEW SECTION ---
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