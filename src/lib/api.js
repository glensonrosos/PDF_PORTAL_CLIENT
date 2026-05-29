import axios from 'axios';

// Prefer explicit env, otherwise derive from current browser location
// Example: http://localhost:3000 -> http://localhost:5000
//          http://10.0.1.221:3000 -> http://10.0.1.221:5000
const inferredBase = (() => {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname } = window.location;
  const apiPort = 5007; // server default
  return `${protocol}//${hostname}:${apiPort}`;
})();

const base = (process.env.REACT_APP_API_BASE_URL || inferredBase || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: base + '/api',
});

// Attach Authorization header from localStorage token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
