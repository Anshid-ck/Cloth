// src/api/orders.js
import API from './api';

export const ordersAPI = {
  // orders.js ✅ Fixed
  getOrders: () => API.get('/api/orders/'),
  getOrder: (id) => API.get(`/api/orders/${id}/`),
  createOrder: (data) => API.post('/api/orders/create/', data),
  trackOrder: (id) => API.get(`/api/orders/${id}/track/`),
  cancelOrder: (id) => API.post(`/api/orders/${id}/cancel/`),
};