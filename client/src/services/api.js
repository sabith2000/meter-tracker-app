// meter-tracker/client/src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // You can add other common headers here if needed, like Authorization tokens later
  },
});

// You can also add interceptors here for request or response handling (e.g., error handling, token refresh)
// apiClient.interceptors.response.use(response => response, error => {
//   // Handle global errors
//   return Promise.reject(error);
// });

export default apiClient;