
import axios from 'axios';

const TOKEN_KEY = 'ha_token';
const USER_KEY = 'ha_user';

const configuredBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = import.meta.env.DEV
  ? ''
  : configuredBase || 'https://college-hostel-attendance-management.onrender.com';

const http = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : '/api',
  timeout: 60000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    const message =
      err.response?.data?.message ||
      (err.code === 'ECONNABORTED'
        ? 'Request timed out. Check the backend server.'
        : err.response
          ? `Server error: ${err.response.status}`
          : `Network error. Check backend URL and CORS settings (${API_BASE || 'Vite /api proxy'}).`);

    return Promise.reject(new Error(message));
  }
);

export default http;
