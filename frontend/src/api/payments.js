// src/api/payments.js
import API from './api';

export const paymentsAPI = {
  // payments.js ✅ Fixed
  createPayment: (data) => API.post('/api/payments/create/', data),
  confirmPayment: (data) => API.post('/api/payments/confirm/', data),
  verifyStripe: (data) => API.post('/api/payments/confirm/', data),
  getPayment: (orderId) => API.get(`/api/payments/order/${orderId}/`),
  requestRefund: (data) => API.post('/api/payments/refund/request/', data),
  getRefund: (refundId) => API.get(`/api/payments/refund/${refundId}/`),
};