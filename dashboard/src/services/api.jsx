import axios from 'axios';

// ===========================================
// API CONFIGURATION
// ===========================================
// In development: Uses localhost:3000
// In production: Uses VITE_API_URL from .env
// ===========================================

const getApiUrl = () => {
  // Check for environment variable first (production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback to localhost for development
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiUrl();

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000, // 15 second timeout for slower connections
});

// Request interceptor - adds auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.message);
    
    // Handle 401 - unauthorized
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - clearing token');
      localStorage.removeItem('token');
      // Optionally redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ===========================================
// AUTH API
// ===========================================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// ===========================================
// PRODUCTS API
// ===========================================
export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
};

// ===========================================
// ORDERS API
// ===========================================
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  create: (orderData) => api.post('/orders', orderData),
  updateStatus: (id, status) => api.put(`/orders/${id}`, { status }),
};

// ===========================================
// SETTINGS API
// ===========================================
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (settingsData) => api.put('/settings', settingsData),
  getThemes: () => api.get('/settings/themes'),
  getAddOns: () => api.get('/settings/add-ons'),
  activateAddOn: (id, paymentData) => api.post(`/settings/add-ons/${id}/activate`, paymentData),
};

export default api;
