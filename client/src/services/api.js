// meter-tracker/client/src/services/api.js
import axios from 'axios';

// --- NEW DEBUG LOG ---
console.log("API Base URL used by Frontend:", import.meta.env.VITE_API_BASE_URL);
// --- END DEBUG LOG ---

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;