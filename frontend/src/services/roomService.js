// src/services/roomService.js
import api from './api';

export const roomService = {
  // Fetch all rooms (public/boarder/admin)
  getAllRooms: async () => {
    const response = await api.get('/rooms');
    return response.data;
  },

  // Fetch specific room details and its current occupants
  getRoomDetails: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  // Admin: Fetch all boarders
  getBoarders: async () => {
    const response = await api.get('/admin/boarders');
    return response.data;
  },

  // Admin: Allocate a boarder to a room
  allocateRoom: async (boarderId, roomId) => {
    const response = await api.put(`/admin/boarders/${boarderId}/room`, {
      room_id: roomId
    });
    return response.data;
  }
};