// src/services/authService.js
import api from './api';

export const authService = {
  getAdminBootstrapStatus: async () => {
    const response = await api.get('/admin-bootstrap/status');
    return response.data;
  },
  bootstrapAdmin: async (name, email, password, setupKey) => {
    const response = await api.post('/admin-bootstrap', {
      name,
      email,
      password,
      setup_key: setupKey,
    });
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('hostelsync_token', response.data.token);
      localStorage.setItem('hostelsync_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (name, email, password) => {
    const response = await api.post('/register', { name, email, password });
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const response = await api.post('/password-reset/request', { email });
    return response.data;
  },

  confirmPasswordReset: async (token, password) => {
    const response = await api.post('/password-reset/confirm', { token, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('hostelsync_token');
    localStorage.removeItem('hostelsync_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('hostelsync_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
