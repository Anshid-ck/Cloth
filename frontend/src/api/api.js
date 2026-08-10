// src/api/api.js
import axios from 'axios';
import { clearAuth } from '../redux/slices/authSlice';

// Lazily inject the Redux store to avoid circular import issues.
// Call setStore(store) once from main.jsx after the store is created.
let _store = null;
export const setStore = (store) => { _store = store; };

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public endpoints — a 401 on these means "try without auth", not "refresh token"
const publicEndpoints = [
  '/api/products/banners',
  '/api/products/category-cards',
  '/api/products/bottom-styles',
  '/api/products/mens-hoodie-grid',
  '/api/products/products',
  '/api/products/categories',
  '/api/products/search',
  '/api/products/colors',
  '/api/products/sizes',
];

const isPublicEndpoint = (url) =>
  publicEndpoints.some(endpoint => url?.includes(endpoint));

// The refresh endpoint must never itself be retried or it will loop forever.
const isRefreshEndpoint = (url) =>
  url?.includes('/token/refresh/');

// ─── Request interceptor ────────────────────────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Token refresh state ────────────────────────────────────────────────────
// Shared promise so concurrent 401s share a single refresh request.
let refreshPromise = null;

// ─── Response interceptor ───────────────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 1. Never retry the refresh endpoint — propagate immediately.
    if (isRefreshEndpoint(originalRequest?.url)) {
      return Promise.reject(error);
    }

    // 2. Public endpoint 401: retry once without the Authorization header.
    if (status === 401 && isPublicEndpoint(originalRequest?.url)) {
      if (!originalRequest._retryWithoutAuth) {
        originalRequest._retryWithoutAuth = true;
        delete originalRequest.headers.Authorization;
        return API(originalRequest);
      }
      return Promise.reject(error);
    }

    // 3. Protected endpoint 401: attempt a token refresh (once per request).
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        // Share a single in-flight refresh across concurrent 401s.
        if (!refreshPromise) {
          refreshPromise = API.post('/api/auth/token/refresh/', { refresh: refreshToken })
            .finally(() => { refreshPromise = null; });
        }

        const response = await refreshPromise;
        const newAccessToken = response.data.access;

        // Persist the new token.
        localStorage.setItem('access_token', newAccessToken);
        API.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request with the fresh token.
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);

      } catch {
        // Refresh failed — clear all auth state so the UI reacts correctly.
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('is_admin');
        localStorage.removeItem('admin_role');

        // Reset Redux auth state (no phantom isAuthenticated: true).
        if (_store) {
          _store.dispatch(clearAuth());
        }

        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
