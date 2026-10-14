// src/services/noticeService.js
import api from './api';

export const noticeService = {
  getNotices: async () => {
    const response = await api.get('/notices');
    return response.data;
  },
  createNotice: async (title, content) => {
    const response = await api.post('/notices', { title, content });
    return response.data;
  },
  deleteNotice: async (id) => {
    const response = await api.delete(`/notices/${id}`);
    return response.data;
  }
};