// src/api/admin.js
import API from './api';

export const adminAPI = {
  // Login
  login: (data) => API.post('/api/admin-panel/login/', data),
  checkAuth: () => API.get('/api/admin-panel/check/'),

  // Dashboard
  getDashboardStats: () => API.get('/api/admin-panel/dashboard-stats/'),
  getSalesReport: (period = 'monthly') =>
    API.get('/api/admin-panel/sales-report/', { params: { period } }),
};