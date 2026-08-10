// src/api/auth.js
import API from './api';

export const authAPI = {
  register: (data) => API.post('/api/auth/register/', data),
  verifyEmail: (data) => API.post('/api/auth/verify-email/', data),

  // Login and Logout
  login: (data) => API.post('/api/auth/login/', data),
  googleLogin: (token) => API.post('/api/auth/google-login/', { token }),
  adminLogin: (data) => API.post('/api/auth/admin-login/', data),
  logout: () => API.post('/api/auth/logout/'),

  // Password Management
  changePassword: (data) => API.post('/api/auth/change-password/', data),
  forgotPassword: (data) => API.post('/api/auth/forgot-password/', data),
  resetPassword: (data) => API.post('/api/auth/reset-password/', data),

  // Profile
  getProfile: () => API.get('/api/auth/profile/'),
  updateProfile: (data) => API.put('/api/auth/profile/', data),

  // Addresses
  getAddresses: () => API.get('/api/auth/addresses/'),
  createAddress: (data) => API.post('/api/auth/addresses/', data),
  updateAddress: (id, data) => API.put(`/api/auth/addresses/${id}/`, data),
  deleteAddress: (id) => API.delete(`/api/auth/addresses/${id}/`),

  // Admin
  getAllUsers: (page = 1, search = '') => API.get(`/api/auth/admin/users/?page=${page}&search=${search}`),
  manageUser: (userId, action) => API.post(`/api/auth/admin/users/${userId}/`, { action }),
};
