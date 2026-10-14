// src/services/roomSwapService.js
import api from './api';

export const roomSwapService = {
  // --- Tell your backend team to add these two GET endpoints! ---
  getMySwaps: async () => {
    const response = await api.get('/room-swaps'); 
    return response.data;
  },
  getAdminSwaps: async () => {
    const response = await api.get('/admin/room-swaps');
    return response.data;
  },
  // --------------------------------------------------------------

  createSwap: async (receiverId) => {
    const response = await api.post('/room-swaps', { receiver_id: receiverId });
    return response.data;
  },

  boarderRespond: async (swapId, accepted) => {
    const response = await api.put(`/room-swaps/${swapId}/respond`, { accepted });
    return response.data;
  },

  adminRespond: async (swapId, approved) => {
    const response = await api.put(`/admin/room-swaps/${swapId}`, { approved });
    return response.data;
  }
};