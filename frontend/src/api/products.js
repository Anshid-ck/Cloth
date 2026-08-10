// src/api/products.js
import API from './api';

export const productsAPI = {
  // ✅ Fixed - add /api/ prefix
  getProducts: (params) => API.get('/api/products/products/', { params }),
  getCategories: () => API.get('/api/products/categories/'),
  getProduct: (slug) => API.get(`/api/products/products/${slug}/`),
  searchProducts: (query) => API.get('/api/products/search/', { params: { q: query } }),
  getColors: () => API.get('/api/products/colors/'),
  getSizes: () => API.get('/api/products/sizes/'),
  getBanners: () => API.get('/api/products/banners/'),
};