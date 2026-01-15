import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register/', userData),
  login: (username, password) => api.post('/auth/login/', { username, password }),
  logout: () => {
    const response = api.post('/auth/logout/');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response;
  },
  getProfile: () => api.get('/auth/profile/'),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories/'),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.put(`/categories/${id}/`, data),
  delete: (id) => api.delete(`/categories/${id}/`),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions/', { params }),
  create: (data) => api.post('/transactions/', data),
  update: (id, data) => api.put(`/transactions/${id}/`, data),
  delete: (id) => api.delete(`/transactions/${id}/`),
  getSummary: (params) => api.get('/transactions/summary/', { params }),
};

// Budgets API
export const budgetsAPI = {
  getAll: () => api.get('/budgets/'),
  create: (data) => api.post('/budgets/', data),
  update: (id, data) => api.put(`/budgets/${id}/`, data),
  delete: (id) => api.delete(`/budgets/${id}/`),
};

export default api;