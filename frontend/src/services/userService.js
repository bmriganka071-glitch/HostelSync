// src/services/userService.js
import api from './api';

export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getBoarders: async () => {
    const response = await api.get('/admin/boarders');
    return response.data;
  },
  promoteToAdmin: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role: 'ADMIN' });
    return response.data;
  },
};
