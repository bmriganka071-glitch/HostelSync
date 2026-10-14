// src/services/messRebateService.js
import api from './api';

export const messRebateService = {
  // Fetches rebates (Backend handles whether it returns all for admin or just personal for boarder)
  getRebates: async () => {
    const response = await api.get('/mess-rebates');
    return response.data;
  },

  // Boarder applies for a rebate
  applyRebate: async (startDate, endDate) => {
    const response = await api.post('/mess-rebates', { 
      start_date: startDate, 
      end_date: endDate 
    });
    return response.data;
  },

  // Admin approves or rejects a rebate
  processRebate: async (rebateId, isApproved) => {
    const response = await api.put(`/admin/mess-rebates/${rebateId}`, { 
      approved: isApproved 
    });
    return response.data;
  }
};