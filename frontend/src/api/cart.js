// src/api/cart.js
import API from './api';

export const cartAPI = {
  getCart: () => API.get('/api/cart/'),
  addToCart: (data) => API.post('/api/cart/add/', data),
  updateCart: (itemId, data) => API.put(`/api/cart/update/${itemId}/`, data),
  removeFromCart: (itemId) => API.delete(`/api/cart/remove/${itemId}/`),
  clearCart: () => API.post('/api/cart/clear/'),
};