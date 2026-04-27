import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — clear storage and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('401 - Session expired');
      alert('Session expired. Please refresh the page or login again.');
      // Don't auto-logout, let user handle
    }
    return Promise.reject(error);
  }
);

export default api;
