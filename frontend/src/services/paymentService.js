// src/services/paymentService.js
import api from './api';

export const paymentService = {
  // Boarder functions
  getMyBills: async () => {
    const response = await api.get('/mess-bills');
    return response.data;
  },
  getMyPayments: async () => {
    const response = await api.get('/payments');
    return response.data;
  },
  submitPayment: async (billId, paymentReference) => {
    const response = await api.post('/payments', { 
      bill_id: billId, 
      payment_reference: paymentReference 
    });
    return response.data;
  },

  // Admin functions
  getAllPayments: async () => {
    const response = await api.get('/admin/payments');
    return response.data;
  },
  getAllMessBills: async () => {
    const response = await api.get('/admin/mess-bills');
    return response.data;
  },
  createMessBill: async (bill) => {
    const response = await api.post('/admin/mess-bills', bill);
    return response.data;
  },
  verifyPayment: async (paymentId, isVerified) => {
    const response = await api.put(`/admin/payments/${paymentId}`, {
      verified: isVerified
    });
    return response.data;
  }
};
