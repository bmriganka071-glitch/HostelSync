// src/services/eventService.js
import api from './api';

export const eventService = {
  getEvents: async () => {
    const response = await api.get('/events');
    return response.data;
  },
  createEvent: async (title, description, eventDate) => {
    const response = await api.post('/events', { 
      title, 
      description, 
      event_date: eventDate 
    });
    return response.data;
  },
  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  }
};